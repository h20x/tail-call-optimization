const CONTINUE = Math.random();

function tco(fd) {
  const fns = genFnsObject(genLocalFns(fd));
  const result = fd.map(([name]) => {
    return (...args) => genFinalFn(name, fns)(...args);
  });

  return result;
}

function genFnsObject(fns) {
  let body = '';

  for (const [name, code] of fns.entries()) {
    body += `${name}: ${code},`;
  }

  return `{ ${body} }`;
}

function genLocalFns(fd) {
  const fns = new Map();

  for (const def of fd) {
    fns.set(def[0], genLocalFn(def, fd));
  }

  return fns;
}

function genLocalFn(def, fd) {
  let [, args, body] = def;

  body = genFakeFns(findFns(body, fd)) + body;

  return `(${args.join(', ')}) => { ${body} }`;
}

function genFakeFns(names) {
  return names
    .map((name) => {
      return `
        function ${name}() {
          __input__ = [...arguments];
          __curfn__ = '${name}';

          return ${CONTINUE};
        }\n`;
    })
    .join('');
}

function findFns(body, fd) {
  const fns = [];
  const regexp = /((\w|\.)+)\s*\(/gi;
  let result;

  while ((result = regexp.exec(body))) {
    if (fd.find(([name]) => name === result[1])) {
      fns.push(result[1]);
    }
  }

  return fns;
}

function genFinalFn(name, fns) {
  const code = `
    let __input__ = [...arguments];
    let __curfn__ = '${name}';
    let __fns__ = ${fns};

    while (true) {
      let __result__ = __fns__[__curfn__](...__input__);

      if (${CONTINUE} === __result__) {
        continue;
      }

      return __result__;
    }
  `;

  return new Function(code);
}

module.exports = { tco };
