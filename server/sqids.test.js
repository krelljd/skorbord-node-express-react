const Sqids = require('sqids').default;

describe('Sqids encoding', () => {
  it('should encode scoreboard id 1 to BoardSqid MXsAKe', () => {
    const sqids = new Sqids({ 
      minLength: 6, 
      alphabet: 'hPrUuF3oQfeEGwRZX1d9ac5MB0AkgLqlynOpTVzCWJtDjsN8I7i42xvHSK6Ymb' 
    });
    const sqid = sqids.encode([1]);
    expect(sqid).toBe('MXsAKe');
  });
});
