const { tco } = require('./tco');

describe('tco', () => {
  test('simple tail recursives', () => {
    expect(tco([['f', ['x'], 'return x?f(--x):"Yay"']])[0](1e5)).toBe('Yay');
    expect(
      tco([['f', ['x', 'y'], 'return 0<x?f(x-3,(y||0)+17):y%21']])[0](1e5)
    ).toBe(14);
  });

  test('built-in functions', () => {
    let from = Date.now();
    let current;

    tco([
      [
        'Sleep',
        ['x', 'n'],
        'return n=n||Date.now(),n+x<=Date.now()||Sleep(x,n)',
      ],
    ])[0](100);

    current = Date.now();

    expect(from + 100 <= current).toBe(true);

    const count = tco([
      ['f', ['x', 'c'], 'return x?f(Math.random()<.2?--x:x,1+(0|c)):c'],
    ])[0](10000);

    expect(30000 <= count && count <= 70000);
  });

  test('errors', () => {
    let ex;

    try {
      tco([['f', ['x'], 'if(!x)throw";-)";return f(--x)']])[0](1e5);
    } catch (e) {
      ex = e;
    }

    expect(ex).toBe(';-)');

    expect(() => {
      tco([['f', [], 'return(function f(x){return x?f(--x):"⑤"})(1e5)']])[0]();
    }).toThrow();
  });

  test('simple tail calls', () => {
    const fg = tco([
      ['f', ['n', 's'], 'return n ? g(--n,s || 0) : s'],
      ['g', ['n', 's'], 'if (n < 0) n = 3;return f(--n,s + n)'],
    ]);

    expect(fg[0](1e5)).toBe(2499950000);
    expect(fg[0](1e5 + 1)).toBe(2500000001);
    expect(fg[1](-1e5, 7)).toBe(9);
  });

  test('tail call circles', () => {
    const fun = [...Array(10000)].map((_, f) => [
      'f' + f,
      ['x', 'y'],
      `return f${1 + f}(x,y)`,
    ]);

    fun[0][2] = 'return x?f1(--x,"⑨"):y';
    fun[10][2] = 'return f11(x,y+y)';
    fun[fun.length - 1][2] = 'return f0(x,y)';

    expect(tco(fun)[0](2)).toBe('⑨⑨');
  });
});
