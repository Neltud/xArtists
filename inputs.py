from vellum.workflows import BaseInputs


class Inputs(BaseInputs):
    # Wallet & execution mode
    wallet_address: str = "erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6"
    force_mode: str = "auto"  # auto | paper | live

    # Average entry prices (for ROI / TP-SL tracking)
    avg_entry_egld: float = 0.0
    avg_entry_wbtc: float = 0.0
    avg_entry_wtao: float = 0.0
    avg_entry_tro: float = 0.0
