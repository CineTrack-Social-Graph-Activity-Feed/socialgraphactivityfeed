import React, { useState } from "react";
import "./TabBar.css";

export default function Tabs({ onChange }) {
  const [active, setActive] = useState("SEGUIDOS");

  const tabs = [
    { key: "SEGUIDOS", label: "SEGUIDOS" },
    { key: "SEGUIDORES", label: "SEGUIDORES" },
  ];

  const handleClick = (key) => {
    setActive(key);
    if (onChange) onChange(key);
  };

  return (
    <div className="tabs">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`tab-button ${active === tab.key ? "active" : ""}`}
          onClick={() => handleClick(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
