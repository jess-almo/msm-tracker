from pathlib import Path

text = Path("src/components/IslandPlanner.jsx").read_text()
start = text.index("{activeIsland && (")
end = text.index("      {showScrollTop && (")
print(text[start:end])
