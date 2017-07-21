/*
*   helper funcs for common formatting tasks. note that if this comment
*   is here, it means the functions need to be tested.
*/

class Fmt() {
    constructor() { };
    
    static concat(multiline, indented ...text) {
        return text.map(m => `${indented ? \t : ''}${m}${multiline ? \n : ''}`).join('');
    };
    
    static div(content, escaped) {
        return $('<div></div>').[`${escaped ? 'text' : 'html'}`](content);
    };
    
    static jq(idstring, isclass) {
        return $(`${isclass ? '.' : '#'}${idstring}`);
    };
}