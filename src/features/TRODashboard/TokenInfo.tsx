import React from "react";

/**
 * TokenInfo: Displays $TRO token details.
 * Props:
 *   - info: token info object
 */
const TokenInfo: React.FC<{ info: any }> = ({ info }) => {
  const price = Number(info?.price?.usd) || 0.1;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {info.assets?.avatar && (
          <img src={info.assets.avatar} alt="TRO" style={{ width: 48, height: 48, borderRadius: 12 }} />
        )}
        <div>
          <b>{info.name}</b> <span style={{ color: "#5a3be7" }}>{info.identifier}</span>
        </div>
      </div>
      <ul style={{ marginTop: 16 }}>
        <li>
          <b>Price:</b> <span aria-label="TRO price">${price.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
        </li>
        <li>
          <b>Market Cap:</b> <span aria-label="Market cap">${Number(info.marketCap).toLocaleString()}</span>
        </li>
        <li>
          <b>Total Supply:</b> <span aria-label="Total supply">{Number(info.supply) / 10 ** info.decimals}</span>
        </li>
        <li>
          <b>Circulating Supply:</b> <span aria-label="Circulating supply">{Number(info.circulatingSupply) / 10 ** info.decimals}</span>
        </li>
        <li>
          <b>Holders:</b> <span aria-label="Holders">{info.holders}</span>
        </li>
        <li>
          <b>Website:</b>{" "}
          <a href={info.website} target="_blank" rel="noopener noreferrer" aria-label="TRO website">
            {info.website}
          </a>
        </li>
      </ul>
      <div style={{ marginTop: 12, fontSize: "0.98rem", color: "#555" }}>
        {info.description}
      </div>
      <div style={{ marginTop: 18 }}>
        <a
          href={`https://explorer.multiversx.com/tokens/${info.identifier}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#5a3be7", fontWeight: 600 }}
          aria-label="View on MultiversX Explorer"
        >
          View on MultiversX Explorer
        </a>
      </div>
    </div>
  );
};

export default TokenInfo;
