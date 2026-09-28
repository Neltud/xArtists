#![no_std]

multiversx_sc_wasm_adapter::allocator!();
multiversx_sc_wasm_adapter::panic_handler!();

multiversx_sc_wasm_adapter::endpoints! {
    venue_split
    (
        init => init
        upgrade => upgrade
        setPaused => set_paused
        rentPay => rent_pay
        rentPayEsdt => rent_pay_esdt
        getSplitBps => get_split_bps
        getBuckets => get_buckets
        getPaused => get_paused
        getTotalEgldRouted => get_total_egld_routed
    )
}

multiversx_sc_wasm_adapter::async_callback_empty! {}
