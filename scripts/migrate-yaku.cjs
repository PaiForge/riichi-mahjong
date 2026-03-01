const fs = require('fs');
const path = require('path');

const definitionsDir = path.join(__dirname, '../src/features/yaku/lib/definitions');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Multi-line replace with trailing comma support
    const regex = /export\s+const\s+(\w+Definition)(?:\s*:\s*YakuDefinition)?\s*=\s*createYakuDefinition\s*\(\s*([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s*,?\s*\);/g;

    content = content.replace(regex, (match, defName, yakuVar, checkFunc) => {
        return `export const ${defName}: YakuDefinition = createYaku(
  ${yakuVar}.name,
  ${yakuVar}.han.closed,
  typeof ${yakuVar}.han.open === "number" ? ${yakuVar}.han.open : 0
)
  .require(${checkFunc})
  .build();`;
    });

    fs.writeFileSync(filePath, content, 'utf8');
}

function run() {
    const files = fs.readdirSync(definitionsDir).filter(f => f.endsWith('.ts') && !f.endsWith('.test.ts'));
    for (const file of files) {
        if (file === 'index.ts') continue;
        processFile(path.join(definitionsDir, file));
    }
}

run();
