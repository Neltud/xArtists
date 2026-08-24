from lia.compounding.simulate_paper import run
if __name__ == "__main__":
    p = run()
    print("OK", p["aggregate"])
