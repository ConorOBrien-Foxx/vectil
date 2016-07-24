class Stack {
	constructor(){
		this.size = 0;
		this.data = {};
	}
	
	push(v){
		this.data[this.size] = v;
		this.size++;
	}
	
	pop(){
		if(this.size === 0)
			throw new Error("popping from an empty stack");
		
		return this.data[--this.size];
	}
	
	get top(){
		return this.data[this.size - 1];
	}
	
	set top(v){
		this.pop();
		this.push(v);
	}
	
	toString(){
		let result = "";
		for(let i = 0; i < this.size; i++){
			result += this.data[i] + 
				(i !== this.size - 1 ? ", " : "");
		}
		return `[ ${result} ]`;
	}
}

module.exports = exports.default = Stack;