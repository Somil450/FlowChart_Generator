const { parseCode } = require('./backend/src/parsers/codeParser');
const { validatePerfect } = require('./backend/src/validation/perfectValidator');

const rustCode = `
fn main() {
    let x = 5;
    if x > 0 {
        println!("Positive");
    } else {
        println!("Non-positive");
    }
}
`;

(async () => {
  try {
    const result = await parseCode(rustCode, 'rust');
    console.log("--- DETERMINISTIC RUST RESULT ---");
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(err);
  }
})();
