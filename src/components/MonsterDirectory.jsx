import React, { useMemo, useState } from "react";
import { MONSTER_DATABASE } from "../data/monsterDatabase";
import {
  AMBER_TRACKER_SHEET_DEFAULTS,
  BOSKUS_DEFAULT,
  ZIGGURAB_DEFAULT,
} from "../data/sheets";
import {
  getBreedingComboByMonsterName,
  getBreedingTimeDataByMonsterName,
} from "../utils/breedingCombos";
import {
  compareMonsterEntriesByPriority,
  getMonsterRequirementUsage,
} from "../utils/monsterPriority";
import {
  getElementAuraStyle,
  getMonsterMetadata,
  getMonsterPortrait,
} from "../utils/monsterMetadata";
import ElementChip from "./ElementChip";

const cardStyle = {
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "18px",
  padding: "18px",
  background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.025))",
  boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
};

const buttonStyle = {
  padding: "8px 14px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.08)",
  color: "inherit",
  cursor: "pointer",
  fontWeight: 600,
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.08)",
  color: "inherit",
};

const filterSectionStyle = {
  display: "grid",
  gap: "10px",
};

const quickFactStyle = {
  display: "grid",
  gap: "4px",
  minWidth: "120px",
  padding: "10px 12px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.035)",
};

const CORE_ELEMENTS = [
  "Plant",
  "Cold",
  "Air",
  "Water",
  "Earth",
  "Fire",
  "Light",
  "Psychic",
  "Faerie",
  "Bone",
  "Plasma",
  "Shadow",
  "Mech",
  "Crystal",
  "Poison",
  "Celestial",
  "Dipster",
  "Titansoul",
  "Legendary",
  "Mythical",
  "Dream",
  "Control",
  "Hoax",
  "Ruin",
  "Depths",
  "Electricity",
];

const CATEGORY_ORDER = [
  "natural",
  "fire",
  "amber",
  "magical",
  "ethereal",
  "mythical",
  "legendary",
  "seasonal",
  "celestial",
  "dipster",
  "titansoul",
  "paironormal",
  "primordial",
];

const AMBER_CATEGORY_MONSTER_NAMES = new Set([
  BOSKUS_DEFAULT.monsterName,
  ZIGGURAB_DEFAULT.monsterName,
  ...AMBER_TRACKER_SHEET_DEFAULTS.map((sheet) => sheet.monsterName),
]);

function hasText(value)
{
  return typeof value === "string" && value.trim().length > 0;
}

function hasItems(value)
{
  return Array.isArray(value) && value.length > 0;
}

function normalizeCategoryKey(value)
{
  if (typeof value !== "string")
  {
    return "";
  }

  return value.trim().toLowerCase();
}

function getCoreMissingFields(monster)
{
  const missingFields = [];

  if (!hasText(monster.id))
  {
    missingFields.push("id");
  }

  if (!hasText(monster.name))
  {
    missingFields.push("name");
  }

  if (!hasText(monster.category))
  {
    missingFields.push("category");
  }

  if (!hasItems(monster.breedableOn))
  {
    missingFields.push("breedableOn");
  }

  return missingFields;
}

function getAuditMissingFields(monster)
{
  const missingFields = [...getCoreMissingFields(monster)];

  if (!hasItems(monster.elements))
  {
    missingFields.push("elements");
  }

  if (!hasText(monster.combo))
  {
    missingFields.push("combo");
  }

  if (!hasText(monster.notes))
  {
    missingFields.push("notes");
  }

  if (Object.prototype.hasOwnProperty.call(monster, "description") && !hasText(monster.description))
  {
    missingFields.push("description");
  }

  return missingFields;
}

function formatLabel(value)
{
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getComboDisplay(monster, breedingComboData)
{
  if (hasText(monster.combo))
  {
    return monster.combo;
  }

  if (Array.isArray(breedingComboData?.combinations) && breedingComboData.combinations.length > 0)
  {
    return breedingComboData.combinations
      .map((combination) => combination.join(" + "))
      .join(" | ");
  }

  if (Array.isArray(breedingComboData?.genericCombinations) && breedingComboData.genericCombinations.length > 0)
  {
    return breedingComboData.genericCombinations.join(" | ");
  }

  return "";
}

function toggleValue(list, value)
{
  if (list.includes(value))
  {
    return list.filter((item) => item !== value);
  }

  return [...list, value];
}

export default function MonsterDirectory()
{
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [auditFilter, setAuditFilter] = useState("all");
  const [usageFilter, setUsageFilter] = useState("all");
  const [sortMode, setSortMode] = useState("priority");
  const [selectedElements, setSelectedElements] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showSpecialElements, setShowSpecialElements] = useState(false);

  const categories = useMemo(() =>
  {
    const discoveredCategories = Array.from(
      new Set(
        Object.values(MONSTER_DATABASE)
          .map((monster) => normalizeCategoryKey(monster.category))
          .filter(Boolean)
      )
    );

    return discoveredCategories
      .sort((a, b) =>
      {
        const aIndex = CATEGORY_ORDER.indexOf(a);
        const bIndex = CATEGORY_ORDER.indexOf(b);

        if (aIndex !== -1 || bIndex !== -1)
        {
          if (aIndex === -1)
          {
            return 1;
          }

          if (bIndex === -1)
          {
            return -1;
          }

          return aIndex - bIndex;
        }

        return a.localeCompare(b);
      })
      .map((category) => ({
        key: category,
        label: formatLabel(category),
      }));
  }, []);

  const knownElements = useMemo(() =>
  {
    return Array.from(
      new Set(
        Object.values(MONSTER_DATABASE).flatMap((monster) => monster.elements || [])
      )
    ).sort((a, b) => a.localeCompare(b));
  }, []);

  const coreElements = useMemo(() =>
  {
    return CORE_ELEMENTS.filter((element) => knownElements.includes(element));
  }, [knownElements]);

  const specialElements = useMemo(() =>
  {
    return knownElements.filter((element) => !CORE_ELEMENTS.includes(element));
  }, [knownElements]);

  const monsters = useMemo(() =>
  {
    return Object.values(MONSTER_DATABASE).map((monster) =>
    {
      const metadata = getMonsterMetadata(monster.name) || monster;
      const coreMissingFields = getCoreMissingFields(monster);
      const breedingComboData = getBreedingComboByMonsterName(monster.name);
      const comboDisplay = getComboDisplay(monster, breedingComboData);
      const auditMissingFields = getAuditMissingFields(monster).filter((field) =>
        field !== "combo" || !hasText(comboDisplay)
      );
      const aliases = Array.isArray(monster.aliases) ? monster.aliases : [];
      const normalizedCategory = normalizeCategoryKey(monster.category);
      const breedingTimeData = getBreedingTimeDataByMonsterName(monster.name);

      return {
        ...monster,
        ...metadata,
        aliases,
        coreMissingFields,
        auditMissingFields,
        comboDisplay,
        breedingComboData,
        normalizedCategory,
        breedingTimeData,
        portraitSrc: getMonsterPortrait(monster.name),
        isComplete: coreMissingFields.length === 0,
        usage: getMonsterRequirementUsage(monster.name),
      };
    });
  }, []);

  const filteredMonsters = useMemo(() =>
  {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return monsters
      .filter((monster) =>
      {
        if (normalizedQuery)
        {
          const matchesName = monster.name?.toLowerCase().includes(normalizedQuery);
          const matchesAlias = monster.aliases.some((alias) =>
            alias.toLowerCase().includes(normalizedQuery)
          );

          if (!matchesName && !matchesAlias)
          {
            return false;
          }
        }

        const normalizedCategoryFilter = normalizeCategoryKey(categoryFilter);

        if (normalizedCategoryFilter === "amber")
        {
          if (!AMBER_CATEGORY_MONSTER_NAMES.has(monster.name))
          {
            return false;
          }
        }
        else if (
          normalizedCategoryFilter !== "all" &&
          monster.normalizedCategory !== normalizedCategoryFilter
        )
        {
          return false;
        }

        if (selectedElements.length > 0)
        {
          const monsterElements = monster.elements || [];
          const matchesElement = selectedElements.every((element) =>
            monsterElements.includes(element)
          );

          if (!matchesElement)
          {
            return false;
          }
        }

        if (auditFilter === "needs_details" && monster.isComplete)
        {
          return false;
        }

        if (auditFilter === "complete" && !monster.isComplete)
        {
          return false;
        }

        if (auditFilter === "missing_elements" && hasItems(monster.elements))
        {
          return false;
        }

        if (auditFilter === "missing_combo" && hasText(monster.combo))
        {
          return false;
        }

        if (auditFilter === "missing_combo" && hasText(monster.comboDisplay))
        {
          return false;
        }

        if (auditFilter === "missing_notes" && hasText(monster.notes))
        {
          return false;
        }

        if (
          auditFilter === "missing_description" &&
          (
            !Object.prototype.hasOwnProperty.call(monster, "description") ||
            hasText(monster.description)
          )
        )
        {
          return false;
        }

        if (usageFilter === "unused" && monster.usage.length > 0)
        {
          return false;
        }

        if (
          usageFilter !== "all" &&
          usageFilter !== "unused" &&
          !monster.usage.includes(usageFilter)
        )
        {
          return false;
        }

        return true;
      })
      .sort((a, b) =>
      {
        if (sortMode === "a_z")
        {
          return (a.name || "").localeCompare(b.name || "");
        }

        if (sortMode === "needs_details_first" && a.isComplete !== b.isComplete)
        {
          return a.isComplete ? 1 : -1;
        }

        if (sortMode === "complete_first" && a.isComplete !== b.isComplete)
        {
          return a.isComplete ? -1 : 1;
        }

        return compareMonsterEntriesByPriority(a, b);
      });
  }, [auditFilter, categoryFilter, monsters, searchQuery, selectedElements, sortMode, usageFilter]);

  const summary = useMemo(() =>
  {
    return {
      total: monsters.length,
      showing: filteredMonsters.length,
      complete: monsters.filter((monster) => monster.isComplete).length,
      needsDetails: monsters.filter((monster) => !monster.isComplete).length,
    };
  }, [filteredMonsters.length, monsters]);

  return (
    <div style={{ display: "grid", gap: "18px" }}>
      <div style={cardStyle}>
        <div style={{ display: "grid", gap: "16px" }}>
          <div>
            <div style={{ fontSize: "26px", fontWeight: 700 }}>Monster Directory</div>
            <div style={{ marginTop: "6px", fontSize: "14px", opacity: 0.72 }}>
              Search by name, then stack element chips to narrow to exact combos.
            </div>
          </div>

          <div style={filterSectionStyle}>
            <div style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.04em", opacity: 0.72 }}>
              Search
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search monsters by name or alias"
              style={inputStyle}
            />
          </div>

          <div style={{ display: "grid", gap: "14px" }}>
            <div style={filterSectionStyle}>
              <div style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.04em", opacity: 0.72 }}>
                Elements
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  style={{
                    ...buttonStyle,
                    background: selectedElements.length === 0 ? "rgba(255,255,255,0.18)" : buttonStyle.background,
                    border: selectedElements.length === 0
                      ? "1px solid rgba(255,255,255,0.28)"
                      : buttonStyle.border,
                    boxShadow: selectedElements.length === 0
                      ? "0 0 0 1px rgba(255,255,255,0.08), 0 0 18px rgba(255,255,255,0.08)"
                      : "none",
                  }}
                  onClick={() => setSelectedElements([])}
                >
                  All elements
                </button>

                {coreElements.map((element) => (
                  <ElementChip
                    key={element}
                    element={element}
                    isSelected={selectedElements.includes(element)}
                    title={
                      selectedElements.includes(element)
                        ? `Remove ${element} from the filter`
                        : `Filter to monsters that include ${element}`
                    }
                    onClick={() => setSelectedElements((current) => toggleValue(current, element))}
                  />
                ))}
              </div>

              <div style={{ fontSize: "12px", opacity: 0.68, lineHeight: 1.45 }}>
                {selectedElements.length === 0
                  ? "Tap one or more elements to filter. Adding another chip narrows the list to monsters that have both."
                  : `Filtering to monsters with: ${selectedElements.join(" + ")}`}
              </div>

              {specialElements.length > 0 && (
                <div style={{ display: "grid", gap: "10px" }}>
                  <button
                    type="button"
                    style={{
                      ...buttonStyle,
                      justifySelf: "start",
                      background: showSpecialElements ? "rgba(255,255,255,0.18)" : buttonStyle.background,
                    }}
                    onClick={() => setShowSpecialElements((current) => !current)}
                  >
                    {showSpecialElements ? "Hide special elements" : "Show special elements"}
                  </button>

                  {showSpecialElements && (
                    <div style={{ display: "grid", gap: "8px" }}>
                      <div style={{ fontSize: "12px", opacity: 0.68 }}>
                        Special and event elements
                      </div>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {specialElements.map((element) => (
                          <ElementChip
                            key={element}
                            element={element}
                            isSelected={selectedElements.includes(element)}
                            title={
                              selectedElements.includes(element)
                                ? `Remove ${element} from the filter`
                                : `Filter to monsters that include ${element}`
                            }
                            onClick={() => setSelectedElements((current) => toggleValue(current, element))}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ ...filterSectionStyle, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "14px" }}>
              <button
                type="button"
                style={{
                  ...buttonStyle,
                  justifySelf: "start",
                  background: showAdvancedFilters ? "rgba(255,255,255,0.18)" : buttonStyle.background,
                }}
                onClick={() => setShowAdvancedFilters((current) => !current)}
              >
                {showAdvancedFilters ? "Hide advanced filters" : "Show advanced filters"}
              </button>

              {showAdvancedFilters && (
                <div style={{ display: "grid", gap: "14px" }}>
                  <div style={filterSectionStyle}>
                    <div style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.04em", opacity: 0.72 }}>
                      Category
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        style={{
                          ...buttonStyle,
                          background: categoryFilter === "all" ? "rgba(255,255,255,0.18)" : buttonStyle.background,
                        }}
                        onClick={() => setCategoryFilter("all")}
                      >
                        All
                      </button>

                      {categories.map((category) => (
                        <button
                          type="button"
                          key={category.key}
                          style={{
                            ...buttonStyle,
                            background:
                              categoryFilter === category.key
                                ? "rgba(255,255,255,0.18)"
                                : buttonStyle.background,
                          }}
                          onClick={() => setCategoryFilter(category.key)}
                        >
                          {category.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={filterSectionStyle}>
                    <div style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.04em", opacity: 0.72 }}>
                      Sort
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {[ 
                        { key: "priority", label: "Priority" },
                        { key: "a_z", label: "A-Z" },
                        { key: "needs_details_first", label: "Needs details first" },
                        { key: "complete_first", label: "Complete first" },
                      ].map((option) => (
                        <button
                          type="button"
                          key={option.key}
                          style={{
                            ...buttonStyle,
                            background: sortMode === option.key ? "rgba(255,255,255,0.18)" : buttonStyle.background,
                          }}
                          onClick={() => setSortMode(option.key)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={filterSectionStyle}>
                    <div style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.04em", opacity: 0.72 }}>
                      Metadata audit
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {[
                        { key: "all", label: "All" },
                        { key: "needs_details", label: "Needs details" },
                        { key: "complete", label: "Complete" },
                        { key: "missing_elements", label: "Missing elements" },
                        { key: "missing_combo", label: "Missing combo" },
                        { key: "missing_notes", label: "Missing notes" },
                        { key: "missing_description", label: "Missing description" },
                      ].map((option) => (
                        <button
                          type="button"
                          key={option.key}
                          style={{
                            ...buttonStyle,
                            background:
                              auditFilter === option.key
                                ? "rgba(255,255,255,0.18)"
                                : buttonStyle.background,
                          }}
                          onClick={() => setAuditFilter(option.key)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={filterSectionStyle}>
                    <div style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.04em", opacity: 0.72 }}>
                      Requirement usage
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {[
                        { key: "all", label: "All" },
                        { key: "amber", label: "Used in Amber" },
                        { key: "wublin", label: "Used in Wublin" },
                        { key: "celestial", label: "Used in Celestial" },
                        { key: "unused", label: "Unused" },
                      ].map((option) => (
                        <button
                          type="button"
                          key={option.key}
                          style={{
                            ...buttonStyle,
                            background:
                              usageFilter === option.key
                                ? "rgba(255,255,255,0.18)"
                                : buttonStyle.background,
                          }}
                          onClick={() => setUsageFilter(option.key)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              fontSize: "13px",
              opacity: 0.78,
            }}
          >
            <div>Showing {summary.showing} of {summary.total}</div>
            <div>{selectedElements.length} active element filter{selectedElements.length === 1 ? "" : "s"}</div>
            <div>{summary.needsDetails} need details</div>
            <div>{summary.complete} complete</div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: "12px" }}>
        {filteredMonsters.map((monster) => (
          (() =>
          {
            const portraitGlow = getElementAuraStyle(monster.elements || []);

            return (
          <div key={monster.id || monster.name} style={cardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
                {monster.portraitSrc && (
                  <div
                    style={{
                      width: "84px",
                      height: "84px",
                      borderRadius: "20px",
                      border: portraitGlow.border,
                      background: portraitGlow.background,
                      display: "grid",
                      placeItems: "center",
                      overflow: "hidden",
                      boxShadow: portraitGlow.boxShadow,
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={monster.portraitSrc}
                      alt={monster.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        padding: "6px",
                        display: "block",
                      }}
                    />
                  </div>
                )}

                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "24px", fontWeight: 700 }}>
                    {monster.name || "Unnamed monster"}
                  </div>
                  <div style={{ marginTop: "4px", fontSize: "14px", opacity: 0.72 }}>
                    {monster.category ? formatLabel(monster.category) : "No category"}
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: "7px 12px",
                  borderRadius: "999px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: monster.isComplete
                    ? "rgba(34,197,94,0.18)"
                    : "rgba(245,158,11,0.18)",
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                }}
              >
                {monster.isComplete ? "Complete" : "Needs details"}
              </div>
            </div>

            <div style={{ marginTop: "14px", display: "grid", gap: "10px" }}>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {hasItems(monster.elements)
                  ? monster.elements.map((element) => (
                    <ElementChip key={element} element={element} />
                  ))
                  : <span style={{ ...buttonStyle, cursor: "default" }}>No elements listed</span>}
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <div style={quickFactStyle}>
                  <div style={{ fontSize: "11px", fontWeight: 700, opacity: 0.68, letterSpacing: "0.06em" }}>
                    COMBO
                  </div>
                  <div style={{ fontSize: "14px", opacity: 0.88 }}>
                    {monster.comboDisplay || "No combo listed"}
                  </div>
                </div>

                <div style={quickFactStyle}>
                  <div style={{ fontSize: "11px", fontWeight: 700, opacity: 0.68, letterSpacing: "0.06em" }}>
                    BREEDING TIME
                  </div>
                  <div style={{ fontSize: "14px", opacity: 0.88 }}>
                    {monster.breedingTimeData?.breedingTime || "—"}
                    {monster.breedingTimeData?.enhancedBreedingTime
                      ? ` · ${monster.breedingTimeData.enhancedBreedingTime} enhanced`
                      : ""}
                  </div>
                </div>

                <div style={quickFactStyle}>
                  <div style={{ fontSize: "11px", fontWeight: 700, opacity: 0.68, letterSpacing: "0.06em" }}>
                    BREEDABLE ON
                  </div>
                  <div style={{ fontSize: "14px", opacity: 0.88 }}>
                    {monster.breedableOn?.[0] || "—"}
                    {monster.breedableOn?.length > 1 ? ` +${monster.breedableOn.length - 1} more` : ""}
                  </div>
                </div>
              </div>

              <details
                style={{
                  marginTop: "2px",
                  padding: "12px",
                  borderRadius: "14px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                  opacity: 0.86,
                }}
              >
                <summary style={{ cursor: "pointer", fontSize: "13px", fontWeight: 700 }}>
                  More Details
                </summary>

                <div style={{ marginTop: "12px", display: "grid", gap: "8px", fontSize: "14px", opacity: 0.84 }}>
                  <div>Breedable On: {(monster.breedableOn || []).join(", ") || "—"}</div>
                  {"description" in monster && <div>Description: {monster.description || "—"}</div>}
                  <div>Notes: {monster.notes || "—"}</div>
                  {monster.aliases.length > 0 && <div>Aliases: {monster.aliases.join(", ")}</div>}
                  <div>
                    {monster.auditMissingFields.length > 0
                      ? `Missing: ${monster.auditMissingFields.join(", ")}`
                      : "Missing: none"}
                  </div>
                  <div>
                    {monster.usage.length > 0
                      ? `Used in ${monster.usage.map(formatLabel).join(", ")} requirements`
                      : "Used in requirements: —"}
                  </div>
                </div>
              </details>
            </div>
          </div>
            );
          })()
        ))}
      </div>
    </div>
  );
}
