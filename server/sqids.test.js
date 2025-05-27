// Standalone Node.js test to verify that scoreboard id 1 encodes to BoardSqid 'MXsAKe' using the configured Sqids instance
const Sqids = require('sqids').default;

const sqids = new Sqids({ minLength: 6, alphabet: 'hPrUuF3oQfeEGwRZX1d9ac5MB0AkgLqlynOpTVzCWJtDjsN8I7i42xvHSK6Ymb' });
const sqid = sqids.encode([1]);
if (sqid === 'MXsAKe') {
  console.log('PASS: Scoreboard id 1 encodes to BoardSqid MXsAKe');
  process.exit(0);
} else {
  console.error(`FAIL: Scoreboard id 1 encodes to '${sqid}', expected 'MXsAKe'`);
  process.exit(1);
}
