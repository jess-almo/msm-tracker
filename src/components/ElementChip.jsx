import React from "react";
import { getElementChipStyle, getElementIconPath } from "../utils/monsterMetadata";

export default function ElementChip({
  element,
  isSelected = false,
  onClick,
  title,
  style = {},
})
{
  const chipStyle = {
    ...getElementChipStyle(element, isSelected),
    ...style,
  };
  const iconPath = getElementIconPath(element);
  const content = (
    <>
      {iconPath && (
        <img
          src={iconPath}
          alt=""
          aria-hidden="true"
          style={{
            width: "18px",
            height: "18px",
            objectFit: "contain",
            flexShrink: 0,
            filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.18))",
          }}
        />
      )}
      <span>{element}</span>
    </>
  );

  if (typeof onClick === "function")
  {
    return (
      <button
        type="button"
        title={title || element}
        onClick={onClick}
        style={{
          ...chipStyle,
          cursor: "pointer",
        }}
      >
        {content}
      </button>
    );
  }

  return (
    <span title={title || element} style={chipStyle}>
      {content}
    </span>
  );
}
