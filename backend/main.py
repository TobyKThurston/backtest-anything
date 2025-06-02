from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/generate")
async def generate_strategy(request: Request):
    body = await request.json()
    prompt = body.get("prompt")

    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a helpful assistant that converts plain English trading strategies into Python code.\n"
                    "The function must be called implement_strategy(prices) and return a dictionary with:\n"
                    "buy_index (list), sell_index (list), buy_price (list), sell_price (list), amount (list), trade_profit (list), total_profit (float), and percent_return (float).\n"
                    "Use only current or past prices (no look-ahead like prices[i+1]).\n"
                    "Assume the user starts with $1000 capital and reinvests fully in each trade.\n"
                    "Only one open position at a time is allowed."
                )
            },
            {
                "role": "user",
                "content": f"Write the function using only valid Python (no markdown, no comments). Strategy: {prompt}"
            }
        ]
    )

    return {"result": response.choices[0].message.content}

@app.post("/backtest")
async def run_backtest(request: Request):
    body = await request.json()
    user_code = body.get("code")

    df = pd.read_csv("btc.csv")
    prices = df["close"].tolist()
    dates = df["date"].tolist()

    scope = {}
    try:
        exec(user_code, {}, scope)
    except Exception as e:
        return {"error": f"Code error: {str(e)}"}

    strategy_fn = scope.get("implement_strategy")
    if not strategy_fn:
        return {"error": "Your code must define a function called implement_strategy(prices)"}

    try:
        result = strategy_fn(prices)
    except Exception as e:
        return {"error": f"Strategy execution error: {str(e)}"}

    if not isinstance(result, dict):
        return {"error": "Strategy did not return a dictionary."}

    def safe_index_list(key):
        val = result.get(key)
        return val if isinstance(val, list) else [val] if val is not None else []

    buy_idx = safe_index_list("buy_index")
    sell_idx = safe_index_list("sell_index")

    result["buy_date"] = [dates[i] for i in buy_idx if i is not None and i < len(dates)]
    result["sell_date"] = [dates[i] for i in sell_idx if i is not None and i < len(dates)]

    if "total_profit" in result and isinstance(result["total_profit"], (int, float)):
        result["profit"] = round(result["total_profit"], 2)
    else:
        result["profit"] = 0.0

    if "percent_return" in result and isinstance(result["percent_return"], (int, float)):
        result["percent_return"] = round(result["percent_return"], 2)
    else:
        result["percent_return"] = 0.0

    return result

