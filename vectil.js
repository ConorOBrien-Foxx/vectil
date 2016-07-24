if(!d3){
    throw new Error("d3 failed to load");
}

const log = (x) => document.getElementById("console").textContent += x;

class Stack extends Array {
    _pop(){
        let p = this.pop();
        return typeof p === "undefined" ? 0 : p;
    }
}

class Data {
    constructor(v){
        this.value = v;
    }
}

class Op {
    constructor(obj){
        Object.assign(this, obj);
        
        if(!this.symbol) return;
        
        if(Op.members.has(this.symbol))
            throw new Error(`Symbol ${this.symbol} is already defined!`);
        
        Op.members.set(this.symbol, this);
    }
}
Op.members = new Map();

const binary = (f) => (stack, svg) =>
    stack.push(f(...stack.splice(-2)));

const colours = {
    0x0: 0xD72828,  // various reds
    0x1: 0xEF4135,
    0x2: 0x0048E0,  // various blues
    0x3: 0x0055A4,
    0x4: 0x008000,  // irish green
    0x5: 0xFFA500,  // irish orange
    0x6: 0x0039A6,  // russian blue
    0x7: 0xD52B1E,  // russian red
}

const ANSI = [
    0x000000,   // 0: black
    0xAA0000,   // 1: red
    0x00AA00,   // 2: green
    0xAA5500,   // 3: brown/yellow
    0x0000AA,   // 4: blue
    0xAA00AA,   // 5: magenta
    0x00AAAA,   // 6: cyan
    0xAAAAAA,   // 7: grey
    0x555555,   // 8: darkgrey
    0xFF5555,   // 9: brightred
    0x55FF55,   // A: brightgreen
    0xFFFF55,   // B: brightyellow
    0x5555FF,   // C: brightblue
    0xFF55FF,   // D: brightmagenta
    0x55FFFF,   // E: brightcyan
    0xFFFFFF,   // F: white
];

const toColour = (t) => 
    ("000000" + t.toString(16)).slice(-6);

const _getColour = new Op({
    symbol: "a",
    name: "odd colour get",
    effect: (stack, svg) => stack.push(colours[stack._pop()])
});

const _getANSIColour = new Op({
    symbol: "c",
    name: "ANSI colour get",
    effect: (stack, svg) => stack.push(ANSI[stack._pop()])
});

const _height = new Op({
    symbol: "h",
    name: "height set",
    effect: (stack, svg) => svg.attr("height", stack._pop())
});

const _heightGet = new Op({
    symbol: "H",
    name: "height get",
    effect: (stack, svg) => stack.push(svg.attr("height"))
});

const _width = new Op({
    symbol: "w",
    name: "width set",
    effect: (stack, svg) => svg.attr("width", stack._pop())
});

const _widthGet = new Op({
    symbol: "W",
    name: "width get",
    effect: (stack, svg) => stack.push(svg.attr("width"))
});

const _fullGet = new Op({
    symbol: "g",
    name: "height and width get",
    effect: (stack, svg) =>
        stack.push(...[svg.attr("width"), svg.attr("height")].map(Number))
});

const _fullSet = new Op({
    symbol: "f",
    name: "height and width set",
    effect: (stack, svg) =>
        svg.attr("height", stack._pop()) && svg.attr("width", stack._pop())
});

const _rect = new Op({
    symbol: "r",
    name: "draw rectangle",
    effect: (stack, svg) => {
        let t = stack._pop();
        let color = "#" + toColour(t);
        // console.log(color, t);
        let height = stack._pop();
        let width = stack._pop();
        let y = stack._pop();
        let x = stack._pop();
        stack.push(svg.append("rect")
            .attr("x", x)
            .attr("y", y)
            .attr("width", width)
            .attr("height", height)
            .attr("fill", color));
    }
});

// const _boRect = new Op({
    // symbol: "s",
    // effect: (stack, svg) => {
        // let y = stack._pop();
        // let x = stack._pop();
    // }
// });

const _add = new Op({
    symbol: "+",
    name: "add",
    effect: binary((a, b) => a + b)
});

const _sub = new Op({
    symbol: "-",
    name: "sub",
    effect: binary((a, b) => a - b)
});

const _dup = new Op({
    symbol: ":",
    name: "dup",
    effect: (stack, svg) => stack.push(stack[stack.length - 1])
});

const _dupStack = new Op({
    symbol: ";",
    name: "dup stack",
    effect: (stack, svg) => stack.push(...stack)
});

const _fill = new Op({
    symbol: "U",
    name: "fill",
    effect: (stack, svg) => svg.append("rect")
                               .attr("fill", "#" + toColour(stack._pop()))
                               .attr("width", svg.attr("width"))
                               .attr("height", svg.attr("height"))
                               .attr("x", 0)
                               .attr("y", 0)
});

const _horiz = new Op({
    symbol: "o",
    name: "horizontal",
    effect: (stack, svg) => svg.append("rect")
                               .attr("fill", "#" + toColour(stack._pop()))
                               .attr("height", stack._pop())
                               .attr("y", stack._pop())
                               .attr("width", svg.attr("width"))
});

const _vert = new Op({
    symbol: "O",
    name: "vertical",
    effect: (stack, svg) => svg.append("rect")
                               .attr("fill", "#" + toColour(stack._pop()))
                               .attr("width", stack._pop())
                               .attr("x", stack._pop())
                               .attr("height", svg.attr("height"))
});

const _cross = new Op({
    symbol: "x",
    name: "cross",
    effect: (stack, svg, tok, info) => exec(";oO", stack, svg, info)
})

const _sixteen = new Op({
    symbol: "S",
    name: "sixteen",
    effect: (stack, svg) => stack.push(16)
});

const _execute = new Op({
    symbol: "!",
    name: "execute",
    effect: (stack, svg) => stack._pop().effect(stack, svg)
});

const _setRegJ = new Op({
    symbol: "j",
    name: "set register j",
    effect: (stack, svg, tok, info) => info.j = stack._pop()
});

const _getRegJ = new Op({
    symbol: "J",
    name: "get register j",
    effect: (stack, svg, tok, info) => stack.push(info.j)
});

const _setRegK = new Op({
    symbol: "k",
    name: "set register k",
    effect: (stack, svg, tok, info) => info.k = stack._pop()
});

const _getRegK = new Op({
    symbol: "K",
    name: "get register k",
    effect: (stack, svg, tok, info) => stack.push(info.k)
});

const _setRegL = new Op({
    symbol: "l",
    name: "set register l",
    effect: (stack, svg, tok, info) => info.l = stack._pop()
});

const _getRegL = new Op({
    symbol: "L",
    name: "get register l",
    effect: (stack, svg, tok, info) => stack.push(info.l)
});

const _getArbReg = new Op({
    symbol: "@",
    name: "get arbitrary register",
    effect: (stack, svg, tok, info) => stack.push(info[stack._pop()])
});

const _setArbReg = new Op({
    symbol: "#",
    name: "set arbitrary register",
    effect: (stack, svg, tok, info) => {
        let val = stack._pop();
        let reg = stack._pop();
        info[reg] = val;
    }
});

const _logValue = new Op({
    symbol: "b",
    name: "output value",
    effect: (stack, svg, tok, info) => log(stack._pop())
});

const _storeFunc = new Op({
    symbol: "m",
    name: "store function",
    effect: (stack, svg, tok, info) => info.m = stack._pop()
});

const _execFunc = new Op({
    symbol: "M",
    name: "execute function",
    effect: (stack, svg, tok, info) => (info.m.effect(stack, svg, tok, info))
});

const _pseudoFor = new Op({
    symbol: "|",
    name: "pseudo for",
    effect: (stack, svg, tok, info) => {
        let times = stack._pop();
        let func = stack._pop();
        for(let i = 0; i < times; i++){
            stack.push(i);
            func.effect(stack, svg, tok, info);
        }
    }
});


// TODO:
// const _line = new Op({
    
// });

const isNumeric = (n) => /[0-9A-F.]/.test(n);

const tokenize = (str) => {
    let tokens = [];
    for(let i = 0; i < str.length; i++){
        if(isNumeric(str[i])){
            let c = str[i];
            while(isNumeric(str[++i])){
                c += str[i];
            }
            i--;
            // console.log(c);
            tokens.push(new Data(parseInt(c, 16)));
        } else if(str[i] === "'"){
            tokens.push(new Data(str[++i]));
        } else if(str[i] === '"'){
            let r = "";
            while(str[++i] !== '"'){
                if(str[i] === "\\"){
                    let n = str[++i];
                    if(n === "n"){
                        r += "\n";
                    } else if(n === "t"){
                        r += "\t";
                    } else {
                        r += n;
                    }
                } else {
                    r += str[i];
                }
            }
            tokens.push(new Data(r));
        } else if(str[i] === "{"){  // pattern
            let inner = "";
            let depth = 0;
            while(str[++i] !== "}" && !depth && str[i]){
                inner += str[i];
                if(str[i] === "{") depth++;
                if(str[i] === "}") depth--;
            }
            console.log(inner);
            tokens.push(new Data(new Op({
                name: "op",
                body: inner,
                effect: (stack, svg) => exec(inner, stack, svg)
            })));
        } else if(Op.members.has(str[i])){
            tokens.push(Op.members.get(str[i]));
        }
    }
    return tokens;
}

const exec = (code, stack, svg, info) => {
    stack = typeof stack === "undefined" ? new Stack() : stack;
    info = typeof info === "undefined" ? {j: 0x20, k: 0x64, l: 0x10} : info;
    let tokens = tokenize(code);
    svg = typeof svg === "undefined" ? d3.select("body").append("svg") : svg;
    
    for(let i = 0; i < tokens.length; i++){
        // console.log(stack);
        if(tokens[i] instanceof Data){
            stack.push(tokens[i].value);
        } else if(tokens[i] instanceof Op){
            tokens[i].effect(stack, svg, tokens, info);
        } else {
            // idk what to do, just no op
        }
    }
    
    
    var Tsvg = d3.select("svg").attr("xmlns", "http://www.w3.org/2000/svg");
}

window.addEventListener("load", function(){
    document.getElementById("submit").addEventListener("click", function(){
        exec(document.getElementById("code").value);
    });
    // iceland flag
    // K48f48E0U1CSFcxJ8 D72828x
    
    // french flag
    // 4E 34jJf1A 3aOJ1A 1aO
    
    // russian flag
    // 12CwD5h47jJ:6ao8EJ7ao
});