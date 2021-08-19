import { Utils } from "../utils";
import { parse, eval as _eval } from 'expression-eval';
import apic = require('../apic-lib')

interface Rule {
    match: string,
    key: string
}
export class InterpolationService {
    readonly delimiter = ['{{', '}}'];
    // inMem: { [key: string]: string } = {}

    constructor(public initialEnv: { [key: string]: string }, public inMem: { [key: string]: string }) {

    }
    interpolate(str: string) {
        const rules: Rule[] = this.parseRules(str);
        if (rules && rules.length > 0) {
            let context = { ...this.initialEnv, ...this.inMem, apic };
            return this.parseFromRules(str, context, rules);
        }
        return str;
    }

    interpolateObject(obj: { [key: string]: string }): { [key: string]: string } {
        return Utils.objectEntries(obj).reduce((reduced, [key, val]) => {
            reduced[this.interpolate(key)] = (typeof val == 'string') ? this.interpolate(val) : val
            return reduced;
        }, {})
    }

    private parseRules(str: string): Rule[] {
        const execRegex = this.getRegex();
        const matches = str.match(execRegex);
        return (matches || []).map(match => {
            return { match, key: match.replace(new RegExp(this.delimiterStart(), 'g'), '').replace(new RegExp(this.delimiterEnd(), 'g'), '') }
        })
    }

    private parseFromRules(str: string, data: any, rules: Rule[]) {
        return rules.reduce((reducedStr, rule) => this.applyRule(reducedStr, rule, data), str);
    }

    private applyRule(str, rule: Rule, data = {}) {
        const dataToReplace = this.applyData(rule.key, data);
        return str.replace(rule.match, dataToReplace);
    }

    private applyData(key: string, data: any) {
        const ast = parse(key); // abstract syntax tree (AST)
        let evaluated = _eval(ast, data);
        if (!evaluated) evaluated = '';
        return evaluated;
    }

    private getRegex() {
        const regex = `${this.delimiterStart()}([^}]+)${this.delimiterEnd()}`;
        return new RegExp(regex, 'gi');
    }

    hasVariables(str: string): boolean {
        const execRegex = this.getRegex();
        if (!str) return false;
        let match = str.match(execRegex);
        return match?.length > 0;
    }

    delimiterStart() {
        return this.delimiter[0];
    }

    delimiterEnd() {
        return this.delimiter[1];
    }

    /**
     * Method to return a string to be used inside an expression
     * eg: {{abc}} -> abc
     * asdf{{abc}} -> 'asdf'+abc
     * asdf{{abc}}xyz ->  'asdf'+abc+'xyz
     */
    getExpressionString(str: string) {
        let originalStr = str;
        const execRegex = this.getRegex();
        const matches = str.match(execRegex);
        matches.forEach((match, index) => {
            let prefix = '\' + ';
            let postfix = ' + \'';
            if (index == 0 && str.startsWith(this.delimiterStart())) { prefix = '' }
            if (index == (matches.length - 1) && str.endsWith(this.delimiterEnd())) { postfix = '' }

            let replaced = prefix + match.replace(new RegExp(this.delimiterStart(), 'g'), '').replace(new RegExp(this.delimiterEnd(), 'g'), '') + postfix;
            str = str.replace(match, replaced)
        });
        if (!originalStr.startsWith(this.delimiterStart())) str = '\'' + str;
        if (!originalStr.endsWith(this.delimiterEnd())) str = str + '\'';
        return str;
    }
}