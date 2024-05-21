'use strict';

function Route(name, htmlName, defaultRoute, jsFileArr, cssFileArr) {
    try {
        if(!name || !htmlName) {
            throw 'error: name and htmlName params are mandatories';
        }
        this.constructor(name, htmlName, defaultRoute, jsFileArr, cssFileArr);
    } catch (e) {
        console.error(e);
    }
}

Route.prototype = {
    name: undefined,
    htmlName: undefined,
    default: undefined,
    jsFileArr: undefined,
    cssFileArr: undefined,
    constructor: function (name, htmlName, defaultRoute, jsFileArr, cssFileArr) {
        this.name = name;
        this.htmlName = htmlName;
        this.default = defaultRoute;
        this.jsFileArr = jsFileArr;
        this.cssFileArr = cssFileArr;
    },
    isActiveRoute: function (path) {
		if (this.name == "user/")
			return path.startsWith("user/");
        if (this.name == "matchs/")
			return path.startsWith("matchs/");
        return path === this.name;
    }
}
