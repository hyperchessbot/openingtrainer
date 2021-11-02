const ExampleApp = (function () {
    'use strict';

    function createElement(tagName, options) {
        return document.createElement(tagName, options);
    }
    function createElementNS(namespaceURI, qualifiedName, options) {
        return document.createElementNS(namespaceURI, qualifiedName, options);
    }
    function createTextNode(text) {
        return document.createTextNode(text);
    }
    function createComment(text) {
        return document.createComment(text);
    }
    function insertBefore(parentNode, newNode, referenceNode) {
        parentNode.insertBefore(newNode, referenceNode);
    }
    function removeChild(node, child) {
        node.removeChild(child);
    }
    function appendChild(node, child) {
        node.appendChild(child);
    }
    function parentNode(node) {
        return node.parentNode;
    }
    function nextSibling(node) {
        return node.nextSibling;
    }
    function tagName(elm) {
        return elm.tagName;
    }
    function setTextContent(node, text) {
        node.textContent = text;
    }
    function getTextContent(node) {
        return node.textContent;
    }
    function isElement(node) {
        return node.nodeType === 1;
    }
    function isText(node) {
        return node.nodeType === 3;
    }
    function isComment(node) {
        return node.nodeType === 8;
    }
    const htmlDomApi = {
        createElement,
        createElementNS,
        createTextNode,
        createComment,
        insertBefore,
        removeChild,
        appendChild,
        parentNode,
        nextSibling,
        tagName,
        setTextContent,
        getTextContent,
        isElement,
        isText,
        isComment,
    };

    function vnode(sel, data, children, text, elm) {
        const key = data === undefined ? undefined : data.key;
        return { sel, data, children, text, elm, key };
    }

    const array = Array.isArray;
    function primitive(s) {
        return typeof s === "string" || typeof s === "number";
    }

    function isUndef(s) {
        return s === undefined;
    }
    function isDef(s) {
        return s !== undefined;
    }
    const emptyNode = vnode("", {}, [], undefined, undefined);
    function sameVnode(vnode1, vnode2) {
        var _a, _b;
        const isSameKey = vnode1.key === vnode2.key;
        const isSameIs = ((_a = vnode1.data) === null || _a === void 0 ? void 0 : _a.is) === ((_b = vnode2.data) === null || _b === void 0 ? void 0 : _b.is);
        const isSameSel = vnode1.sel === vnode2.sel;
        return isSameSel && isSameKey && isSameIs;
    }
    function isVnode(vnode) {
        return vnode.sel !== undefined;
    }
    function createKeyToOldIdx(children, beginIdx, endIdx) {
        var _a;
        const map = {};
        for (let i = beginIdx; i <= endIdx; ++i) {
            const key = (_a = children[i]) === null || _a === void 0 ? void 0 : _a.key;
            if (key !== undefined) {
                map[key] = i;
            }
        }
        return map;
    }
    const hooks = [
        "create",
        "update",
        "remove",
        "destroy",
        "pre",
        "post",
    ];
    function init(modules, domApi) {
        let i;
        let j;
        const cbs = {
            create: [],
            update: [],
            remove: [],
            destroy: [],
            pre: [],
            post: [],
        };
        const api = domApi !== undefined ? domApi : htmlDomApi;
        for (i = 0; i < hooks.length; ++i) {
            cbs[hooks[i]] = [];
            for (j = 0; j < modules.length; ++j) {
                const hook = modules[j][hooks[i]];
                if (hook !== undefined) {
                    cbs[hooks[i]].push(hook);
                }
            }
        }
        function emptyNodeAt(elm) {
            const id = elm.id ? "#" + elm.id : "";
            // elm.className doesn't return a string when elm is an SVG element inside a shadowRoot.
            // https://stackoverflow.com/questions/29454340/detecting-classname-of-svganimatedstring
            const classes = elm.getAttribute("class");
            const c = classes ? "." + classes.split(" ").join(".") : "";
            return vnode(api.tagName(elm).toLowerCase() + id + c, {}, [], undefined, elm);
        }
        function createRmCb(childElm, listeners) {
            return function rmCb() {
                if (--listeners === 0) {
                    const parent = api.parentNode(childElm);
                    api.removeChild(parent, childElm);
                }
            };
        }
        function createElm(vnode, insertedVnodeQueue) {
            var _a, _b;
            let i;
            let data = vnode.data;
            if (data !== undefined) {
                const init = (_a = data.hook) === null || _a === void 0 ? void 0 : _a.init;
                if (isDef(init)) {
                    init(vnode);
                    data = vnode.data;
                }
            }
            const children = vnode.children;
            const sel = vnode.sel;
            if (sel === "!") {
                if (isUndef(vnode.text)) {
                    vnode.text = "";
                }
                vnode.elm = api.createComment(vnode.text);
            }
            else if (sel !== undefined) {
                // Parse selector
                const hashIdx = sel.indexOf("#");
                const dotIdx = sel.indexOf(".", hashIdx);
                const hash = hashIdx > 0 ? hashIdx : sel.length;
                const dot = dotIdx > 0 ? dotIdx : sel.length;
                const tag = hashIdx !== -1 || dotIdx !== -1
                    ? sel.slice(0, Math.min(hash, dot))
                    : sel;
                const elm = (vnode.elm =
                    isDef(data) && isDef((i = data.ns))
                        ? api.createElementNS(i, tag, data)
                        : api.createElement(tag, data));
                if (hash < dot)
                    elm.setAttribute("id", sel.slice(hash + 1, dot));
                if (dotIdx > 0)
                    elm.setAttribute("class", sel.slice(dot + 1).replace(/\./g, " "));
                for (i = 0; i < cbs.create.length; ++i)
                    cbs.create[i](emptyNode, vnode);
                if (array(children)) {
                    for (i = 0; i < children.length; ++i) {
                        const ch = children[i];
                        if (ch != null) {
                            api.appendChild(elm, createElm(ch, insertedVnodeQueue));
                        }
                    }
                }
                else if (primitive(vnode.text)) {
                    api.appendChild(elm, api.createTextNode(vnode.text));
                }
                const hook = vnode.data.hook;
                if (isDef(hook)) {
                    (_b = hook.create) === null || _b === void 0 ? void 0 : _b.call(hook, emptyNode, vnode);
                    if (hook.insert) {
                        insertedVnodeQueue.push(vnode);
                    }
                }
            }
            else {
                vnode.elm = api.createTextNode(vnode.text);
            }
            return vnode.elm;
        }
        function addVnodes(parentElm, before, vnodes, startIdx, endIdx, insertedVnodeQueue) {
            for (; startIdx <= endIdx; ++startIdx) {
                const ch = vnodes[startIdx];
                if (ch != null) {
                    api.insertBefore(parentElm, createElm(ch, insertedVnodeQueue), before);
                }
            }
        }
        function invokeDestroyHook(vnode) {
            var _a, _b;
            const data = vnode.data;
            if (data !== undefined) {
                (_b = (_a = data === null || data === void 0 ? void 0 : data.hook) === null || _a === void 0 ? void 0 : _a.destroy) === null || _b === void 0 ? void 0 : _b.call(_a, vnode);
                for (let i = 0; i < cbs.destroy.length; ++i)
                    cbs.destroy[i](vnode);
                if (vnode.children !== undefined) {
                    for (let j = 0; j < vnode.children.length; ++j) {
                        const child = vnode.children[j];
                        if (child != null && typeof child !== "string") {
                            invokeDestroyHook(child);
                        }
                    }
                }
            }
        }
        function removeVnodes(parentElm, vnodes, startIdx, endIdx) {
            var _a, _b;
            for (; startIdx <= endIdx; ++startIdx) {
                let listeners;
                let rm;
                const ch = vnodes[startIdx];
                if (ch != null) {
                    if (isDef(ch.sel)) {
                        invokeDestroyHook(ch);
                        listeners = cbs.remove.length + 1;
                        rm = createRmCb(ch.elm, listeners);
                        for (let i = 0; i < cbs.remove.length; ++i)
                            cbs.remove[i](ch, rm);
                        const removeHook = (_b = (_a = ch === null || ch === void 0 ? void 0 : ch.data) === null || _a === void 0 ? void 0 : _a.hook) === null || _b === void 0 ? void 0 : _b.remove;
                        if (isDef(removeHook)) {
                            removeHook(ch, rm);
                        }
                        else {
                            rm();
                        }
                    }
                    else {
                        // Text node
                        api.removeChild(parentElm, ch.elm);
                    }
                }
            }
        }
        function updateChildren(parentElm, oldCh, newCh, insertedVnodeQueue) {
            let oldStartIdx = 0;
            let newStartIdx = 0;
            let oldEndIdx = oldCh.length - 1;
            let oldStartVnode = oldCh[0];
            let oldEndVnode = oldCh[oldEndIdx];
            let newEndIdx = newCh.length - 1;
            let newStartVnode = newCh[0];
            let newEndVnode = newCh[newEndIdx];
            let oldKeyToIdx;
            let idxInOld;
            let elmToMove;
            let before;
            while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
                if (oldStartVnode == null) {
                    oldStartVnode = oldCh[++oldStartIdx]; // Vnode might have been moved left
                }
                else if (oldEndVnode == null) {
                    oldEndVnode = oldCh[--oldEndIdx];
                }
                else if (newStartVnode == null) {
                    newStartVnode = newCh[++newStartIdx];
                }
                else if (newEndVnode == null) {
                    newEndVnode = newCh[--newEndIdx];
                }
                else if (sameVnode(oldStartVnode, newStartVnode)) {
                    patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue);
                    oldStartVnode = oldCh[++oldStartIdx];
                    newStartVnode = newCh[++newStartIdx];
                }
                else if (sameVnode(oldEndVnode, newEndVnode)) {
                    patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue);
                    oldEndVnode = oldCh[--oldEndIdx];
                    newEndVnode = newCh[--newEndIdx];
                }
                else if (sameVnode(oldStartVnode, newEndVnode)) {
                    // Vnode moved right
                    patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue);
                    api.insertBefore(parentElm, oldStartVnode.elm, api.nextSibling(oldEndVnode.elm));
                    oldStartVnode = oldCh[++oldStartIdx];
                    newEndVnode = newCh[--newEndIdx];
                }
                else if (sameVnode(oldEndVnode, newStartVnode)) {
                    // Vnode moved left
                    patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue);
                    api.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
                    oldEndVnode = oldCh[--oldEndIdx];
                    newStartVnode = newCh[++newStartIdx];
                }
                else {
                    if (oldKeyToIdx === undefined) {
                        oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
                    }
                    idxInOld = oldKeyToIdx[newStartVnode.key];
                    if (isUndef(idxInOld)) {
                        // New element
                        api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
                    }
                    else {
                        elmToMove = oldCh[idxInOld];
                        if (elmToMove.sel !== newStartVnode.sel) {
                            api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
                        }
                        else {
                            patchVnode(elmToMove, newStartVnode, insertedVnodeQueue);
                            oldCh[idxInOld] = undefined;
                            api.insertBefore(parentElm, elmToMove.elm, oldStartVnode.elm);
                        }
                    }
                    newStartVnode = newCh[++newStartIdx];
                }
            }
            if (oldStartIdx <= oldEndIdx || newStartIdx <= newEndIdx) {
                if (oldStartIdx > oldEndIdx) {
                    before = newCh[newEndIdx + 1] == null ? null : newCh[newEndIdx + 1].elm;
                    addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
                }
                else {
                    removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
                }
            }
        }
        function patchVnode(oldVnode, vnode, insertedVnodeQueue) {
            var _a, _b, _c, _d, _e;
            const hook = (_a = vnode.data) === null || _a === void 0 ? void 0 : _a.hook;
            (_b = hook === null || hook === void 0 ? void 0 : hook.prepatch) === null || _b === void 0 ? void 0 : _b.call(hook, oldVnode, vnode);
            const elm = (vnode.elm = oldVnode.elm);
            const oldCh = oldVnode.children;
            const ch = vnode.children;
            if (oldVnode === vnode)
                return;
            if (vnode.data !== undefined) {
                for (let i = 0; i < cbs.update.length; ++i)
                    cbs.update[i](oldVnode, vnode);
                (_d = (_c = vnode.data.hook) === null || _c === void 0 ? void 0 : _c.update) === null || _d === void 0 ? void 0 : _d.call(_c, oldVnode, vnode);
            }
            if (isUndef(vnode.text)) {
                if (isDef(oldCh) && isDef(ch)) {
                    if (oldCh !== ch)
                        updateChildren(elm, oldCh, ch, insertedVnodeQueue);
                }
                else if (isDef(ch)) {
                    if (isDef(oldVnode.text))
                        api.setTextContent(elm, "");
                    addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
                }
                else if (isDef(oldCh)) {
                    removeVnodes(elm, oldCh, 0, oldCh.length - 1);
                }
                else if (isDef(oldVnode.text)) {
                    api.setTextContent(elm, "");
                }
            }
            else if (oldVnode.text !== vnode.text) {
                if (isDef(oldCh)) {
                    removeVnodes(elm, oldCh, 0, oldCh.length - 1);
                }
                api.setTextContent(elm, vnode.text);
            }
            (_e = hook === null || hook === void 0 ? void 0 : hook.postpatch) === null || _e === void 0 ? void 0 : _e.call(hook, oldVnode, vnode);
        }
        return function patch(oldVnode, vnode) {
            let i, elm, parent;
            const insertedVnodeQueue = [];
            for (i = 0; i < cbs.pre.length; ++i)
                cbs.pre[i]();
            if (!isVnode(oldVnode)) {
                oldVnode = emptyNodeAt(oldVnode);
            }
            if (sameVnode(oldVnode, vnode)) {
                patchVnode(oldVnode, vnode, insertedVnodeQueue);
            }
            else {
                elm = oldVnode.elm;
                parent = api.parentNode(elm);
                createElm(vnode, insertedVnodeQueue);
                if (parent !== null) {
                    api.insertBefore(parent, vnode.elm, api.nextSibling(elm));
                    removeVnodes(parent, [oldVnode], 0, 0);
                }
            }
            for (i = 0; i < insertedVnodeQueue.length; ++i) {
                insertedVnodeQueue[i].data.hook.insert(insertedVnodeQueue[i]);
            }
            for (i = 0; i < cbs.post.length; ++i)
                cbs.post[i]();
            return vnode;
        };
    }

    function addNS(data, children, sel) {
        data.ns = "http://www.w3.org/2000/svg";
        if (sel !== "foreignObject" && children !== undefined) {
            for (let i = 0; i < children.length; ++i) {
                const childData = children[i].data;
                if (childData !== undefined) {
                    addNS(childData, children[i].children, children[i].sel);
                }
            }
        }
    }
    function h(sel, b, c) {
        let data = {};
        let children;
        let text;
        let i;
        if (c !== undefined) {
            if (b !== null) {
                data = b;
            }
            if (array(c)) {
                children = c;
            }
            else if (primitive(c)) {
                text = c;
            }
            else if (c && c.sel) {
                children = [c];
            }
        }
        else if (b !== undefined && b !== null) {
            if (array(b)) {
                children = b;
            }
            else if (primitive(b)) {
                text = b;
            }
            else if (b && b.sel) {
                children = [b];
            }
            else {
                data = b;
            }
        }
        if (children !== undefined) {
            for (i = 0; i < children.length; ++i) {
                if (primitive(children[i]))
                    children[i] = vnode(undefined, undefined, undefined, children[i], undefined);
            }
        }
        if (sel[0] === "s" &&
            sel[1] === "v" &&
            sel[2] === "g" &&
            (sel.length === 3 || sel[3] === "." || sel[3] === "#")) {
            addNS(data, children, sel);
        }
        return vnode(sel, data, children, text, undefined);
    }

    const xlinkNS = "http://www.w3.org/1999/xlink";
    const xmlNS = "http://www.w3.org/XML/1998/namespace";
    const colonChar = 58;
    const xChar = 120;
    function updateAttrs(oldVnode, vnode) {
        let key;
        const elm = vnode.elm;
        let oldAttrs = oldVnode.data.attrs;
        let attrs = vnode.data.attrs;
        if (!oldAttrs && !attrs)
            return;
        if (oldAttrs === attrs)
            return;
        oldAttrs = oldAttrs || {};
        attrs = attrs || {};
        // update modified attributes, add new attributes
        for (key in attrs) {
            const cur = attrs[key];
            const old = oldAttrs[key];
            if (old !== cur) {
                if (cur === true) {
                    elm.setAttribute(key, "");
                }
                else if (cur === false) {
                    elm.removeAttribute(key);
                }
                else {
                    if (key.charCodeAt(0) !== xChar) {
                        elm.setAttribute(key, cur);
                    }
                    else if (key.charCodeAt(3) === colonChar) {
                        // Assume xml namespace
                        elm.setAttributeNS(xmlNS, key, cur);
                    }
                    else if (key.charCodeAt(5) === colonChar) {
                        // Assume xlink namespace
                        elm.setAttributeNS(xlinkNS, key, cur);
                    }
                    else {
                        elm.setAttribute(key, cur);
                    }
                }
            }
        }
        // remove removed attributes
        // use `in` operator since the previous `for` iteration uses it (.i.e. add even attributes with undefined value)
        // the other option is to remove all attributes with value == undefined
        for (key in oldAttrs) {
            if (!(key in attrs)) {
                elm.removeAttribute(key);
            }
        }
    }
    const attributesModule = {
        create: updateAttrs,
        update: updateAttrs,
    };

    function invokeHandler(handler, vnode, event) {
        if (typeof handler === "function") {
            // call function handler
            handler.call(vnode, event, vnode);
        }
        else if (typeof handler === "object") {
            // call multiple handlers
            for (let i = 0; i < handler.length; i++) {
                invokeHandler(handler[i], vnode, event);
            }
        }
    }
    function handleEvent(event, vnode) {
        const name = event.type;
        const on = vnode.data.on;
        // call event handler(s) if exists
        if (on && on[name]) {
            invokeHandler(on[name], vnode, event);
        }
    }
    function createListener() {
        return function handler(event) {
            handleEvent(event, handler.vnode);
        };
    }
    function updateEventListeners(oldVnode, vnode) {
        const oldOn = oldVnode.data.on;
        const oldListener = oldVnode.listener;
        const oldElm = oldVnode.elm;
        const on = vnode && vnode.data.on;
        const elm = (vnode && vnode.elm);
        let name;
        // optimization for reused immutable handlers
        if (oldOn === on) {
            return;
        }
        // remove existing listeners which no longer used
        if (oldOn && oldListener) {
            // if element changed or deleted we remove all existing listeners unconditionally
            if (!on) {
                for (name in oldOn) {
                    // remove listener if element was changed or existing listeners removed
                    oldElm.removeEventListener(name, oldListener, false);
                }
            }
            else {
                for (name in oldOn) {
                    // remove listener if existing listener removed
                    if (!on[name]) {
                        oldElm.removeEventListener(name, oldListener, false);
                    }
                }
            }
        }
        // add new listeners which has not already attached
        if (on) {
            // reuse existing listener or create new
            const listener = (vnode.listener =
                oldVnode.listener || createListener());
            // update vnode for listener
            listener.vnode = vnode;
            // if element changed or added we add all needed listeners unconditionally
            if (!oldOn) {
                for (name in on) {
                    // add listener if element was changed or new listeners added
                    elm.addEventListener(name, listener, false);
                }
            }
            else {
                for (name in on) {
                    // add listener if new listener added
                    if (!oldOn[name]) {
                        elm.addEventListener(name, listener, false);
                    }
                }
            }
        }
    }
    const eventListenersModule = {
        create: updateEventListeners,
        update: updateEventListeners,
        destroy: updateEventListeners,
    };

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    var oauth2AuthCodePkce = {};

    (function (exports) {
    /**
     * An implementation of rfc6749#section-4.1 and rfc7636.
     */
    var __extends = (commonjsGlobal && commonjsGlobal.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    var __assign = (commonjsGlobal && commonjsGlobal.__assign) || function () {
        __assign = Object.assign || function(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                    t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };
    var __awaiter = (commonjsGlobal && commonjsGlobal.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    var __generator = (commonjsGlobal && commonjsGlobal.__generator) || function (thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    };
    var __spreadArrays = (commonjsGlobal && commonjsGlobal.__spreadArrays) || function () {
        for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
        for (var r = Array(s), k = 0, i = 0; i < il; i++)
            for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
                r[k] = a[j];
        return r;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * A list of OAuth2AuthCodePKCE errors.
     */
    // To "namespace" all errors.
    var ErrorOAuth2 = /** @class */ (function () {
        function ErrorOAuth2() {
        }
        ErrorOAuth2.prototype.toString = function () { return 'ErrorOAuth2'; };
        return ErrorOAuth2;
    }());
    exports.ErrorOAuth2 = ErrorOAuth2;
    // For really unknown errors.
    var ErrorUnknown = /** @class */ (function (_super) {
        __extends(ErrorUnknown, _super);
        function ErrorUnknown() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ErrorUnknown.prototype.toString = function () { return 'ErrorUnknown'; };
        return ErrorUnknown;
    }(ErrorOAuth2));
    exports.ErrorUnknown = ErrorUnknown;
    // Some generic, internal errors that can happen.
    var ErrorNoAuthCode = /** @class */ (function (_super) {
        __extends(ErrorNoAuthCode, _super);
        function ErrorNoAuthCode() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ErrorNoAuthCode.prototype.toString = function () { return 'ErrorNoAuthCode'; };
        return ErrorNoAuthCode;
    }(ErrorOAuth2));
    exports.ErrorNoAuthCode = ErrorNoAuthCode;
    var ErrorInvalidReturnedStateParam = /** @class */ (function (_super) {
        __extends(ErrorInvalidReturnedStateParam, _super);
        function ErrorInvalidReturnedStateParam() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ErrorInvalidReturnedStateParam.prototype.toString = function () { return 'ErrorInvalidReturnedStateParam'; };
        return ErrorInvalidReturnedStateParam;
    }(ErrorOAuth2));
    exports.ErrorInvalidReturnedStateParam = ErrorInvalidReturnedStateParam;
    var ErrorInvalidJson = /** @class */ (function (_super) {
        __extends(ErrorInvalidJson, _super);
        function ErrorInvalidJson() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ErrorInvalidJson.prototype.toString = function () { return 'ErrorInvalidJson'; };
        return ErrorInvalidJson;
    }(ErrorOAuth2));
    exports.ErrorInvalidJson = ErrorInvalidJson;
    // Errors that occur across many endpoints
    var ErrorInvalidScope = /** @class */ (function (_super) {
        __extends(ErrorInvalidScope, _super);
        function ErrorInvalidScope() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ErrorInvalidScope.prototype.toString = function () { return 'ErrorInvalidScope'; };
        return ErrorInvalidScope;
    }(ErrorOAuth2));
    exports.ErrorInvalidScope = ErrorInvalidScope;
    var ErrorInvalidRequest = /** @class */ (function (_super) {
        __extends(ErrorInvalidRequest, _super);
        function ErrorInvalidRequest() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ErrorInvalidRequest.prototype.toString = function () { return 'ErrorInvalidRequest'; };
        return ErrorInvalidRequest;
    }(ErrorOAuth2));
    exports.ErrorInvalidRequest = ErrorInvalidRequest;
    var ErrorInvalidToken = /** @class */ (function (_super) {
        __extends(ErrorInvalidToken, _super);
        function ErrorInvalidToken() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ErrorInvalidToken.prototype.toString = function () { return 'ErrorInvalidToken'; };
        return ErrorInvalidToken;
    }(ErrorOAuth2));
    exports.ErrorInvalidToken = ErrorInvalidToken;
    /**
     * Possible authorization grant errors given by the redirection from the
     * authorization server.
     */
    var ErrorAuthenticationGrant = /** @class */ (function (_super) {
        __extends(ErrorAuthenticationGrant, _super);
        function ErrorAuthenticationGrant() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ErrorAuthenticationGrant.prototype.toString = function () { return 'ErrorAuthenticationGrant'; };
        return ErrorAuthenticationGrant;
    }(ErrorOAuth2));
    exports.ErrorAuthenticationGrant = ErrorAuthenticationGrant;
    var ErrorUnauthorizedClient = /** @class */ (function (_super) {
        __extends(ErrorUnauthorizedClient, _super);
        function ErrorUnauthorizedClient() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ErrorUnauthorizedClient.prototype.toString = function () { return 'ErrorUnauthorizedClient'; };
        return ErrorUnauthorizedClient;
    }(ErrorAuthenticationGrant));
    exports.ErrorUnauthorizedClient = ErrorUnauthorizedClient;
    var ErrorAccessDenied = /** @class */ (function (_super) {
        __extends(ErrorAccessDenied, _super);
        function ErrorAccessDenied() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ErrorAccessDenied.prototype.toString = function () { return 'ErrorAccessDenied'; };
        return ErrorAccessDenied;
    }(ErrorAuthenticationGrant));
    exports.ErrorAccessDenied = ErrorAccessDenied;
    var ErrorUnsupportedResponseType = /** @class */ (function (_super) {
        __extends(ErrorUnsupportedResponseType, _super);
        function ErrorUnsupportedResponseType() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ErrorUnsupportedResponseType.prototype.toString = function () { return 'ErrorUnsupportedResponseType'; };
        return ErrorUnsupportedResponseType;
    }(ErrorAuthenticationGrant));
    exports.ErrorUnsupportedResponseType = ErrorUnsupportedResponseType;
    var ErrorServerError = /** @class */ (function (_super) {
        __extends(ErrorServerError, _super);
        function ErrorServerError() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ErrorServerError.prototype.toString = function () { return 'ErrorServerError'; };
        return ErrorServerError;
    }(ErrorAuthenticationGrant));
    exports.ErrorServerError = ErrorServerError;
    var ErrorTemporarilyUnavailable = /** @class */ (function (_super) {
        __extends(ErrorTemporarilyUnavailable, _super);
        function ErrorTemporarilyUnavailable() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ErrorTemporarilyUnavailable.prototype.toString = function () { return 'ErrorTemporarilyUnavailable'; };
        return ErrorTemporarilyUnavailable;
    }(ErrorAuthenticationGrant));
    exports.ErrorTemporarilyUnavailable = ErrorTemporarilyUnavailable;
    /**
     * A list of possible access token response errors.
     */
    var ErrorAccessTokenResponse = /** @class */ (function (_super) {
        __extends(ErrorAccessTokenResponse, _super);
        function ErrorAccessTokenResponse() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ErrorAccessTokenResponse.prototype.toString = function () { return 'ErrorAccessTokenResponse'; };
        return ErrorAccessTokenResponse;
    }(ErrorOAuth2));
    exports.ErrorAccessTokenResponse = ErrorAccessTokenResponse;
    var ErrorInvalidClient = /** @class */ (function (_super) {
        __extends(ErrorInvalidClient, _super);
        function ErrorInvalidClient() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ErrorInvalidClient.prototype.toString = function () { return 'ErrorInvalidClient'; };
        return ErrorInvalidClient;
    }(ErrorAccessTokenResponse));
    exports.ErrorInvalidClient = ErrorInvalidClient;
    var ErrorInvalidGrant = /** @class */ (function (_super) {
        __extends(ErrorInvalidGrant, _super);
        function ErrorInvalidGrant() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ErrorInvalidGrant.prototype.toString = function () { return 'ErrorInvalidGrant'; };
        return ErrorInvalidGrant;
    }(ErrorAccessTokenResponse));
    exports.ErrorInvalidGrant = ErrorInvalidGrant;
    var ErrorUnsupportedGrantType = /** @class */ (function (_super) {
        __extends(ErrorUnsupportedGrantType, _super);
        function ErrorUnsupportedGrantType() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ErrorUnsupportedGrantType.prototype.toString = function () { return 'ErrorUnsupportedGrantType'; };
        return ErrorUnsupportedGrantType;
    }(ErrorAccessTokenResponse));
    exports.ErrorUnsupportedGrantType = ErrorUnsupportedGrantType;
    /**
     * WWW-Authenticate error object structure for less error prone handling.
     */
    var ErrorWWWAuthenticate = /** @class */ (function () {
        function ErrorWWWAuthenticate() {
            this.realm = "";
            this.error = "";
        }
        return ErrorWWWAuthenticate;
    }());
    exports.ErrorWWWAuthenticate = ErrorWWWAuthenticate;
    exports.RawErrorToErrorClassMap = {
        invalid_request: ErrorInvalidRequest,
        invalid_grant: ErrorInvalidGrant,
        unauthorized_client: ErrorUnauthorizedClient,
        access_denied: ErrorAccessDenied,
        unsupported_response_type: ErrorUnsupportedResponseType,
        invalid_scope: ErrorInvalidScope,
        server_error: ErrorServerError,
        temporarily_unavailable: ErrorTemporarilyUnavailable,
        invalid_client: ErrorInvalidClient,
        unsupported_grant_type: ErrorUnsupportedGrantType,
        invalid_json: ErrorInvalidJson,
        invalid_token: ErrorInvalidToken,
    };
    /**
     * Translate the raw error strings returned from the server into error classes.
     */
    function toErrorClass(rawError) {
        return new (exports.RawErrorToErrorClassMap[rawError] || ErrorUnknown)();
    }
    exports.toErrorClass = toErrorClass;
    /**
     * A convience function to turn, for example, `Bearer realm="bity.com",
     * error="invalid_client"` into `{ realm: "bity.com", error: "invalid_client"
     * }`.
     */
    function fromWWWAuthenticateHeaderStringToObject(a) {
        var obj = a
            .slice("Bearer ".length)
            .replace(/"/g, '')
            .split(', ')
            .map(function (tokens) {
            var _a;
            var _b = tokens.split('='), k = _b[0], v = _b[1];
            return _a = {}, _a[k] = v, _a;
        })
            .reduce(function (a, c) { return (__assign(__assign({}, a), c)); }, {});
        return { realm: obj.realm, error: obj.error };
    }
    exports.fromWWWAuthenticateHeaderStringToObject = fromWWWAuthenticateHeaderStringToObject;
    /**
     * HTTP headers that we need to access.
     */
    var HEADER_AUTHORIZATION = "Authorization";
    var HEADER_WWW_AUTHENTICATE = "WWW-Authenticate";
    /**
     * To store the OAuth client's data between websites due to redirection.
     */
    exports.LOCALSTORAGE_ID = "oauth2authcodepkce";
    exports.LOCALSTORAGE_STATE = exports.LOCALSTORAGE_ID + "-state";
    /**
     * The maximum length for a code verifier for the best security we can offer.
     * Please note the NOTE section of RFC 7636 § 4.1 - the length must be >= 43,
     * but <= 128, **after** base64 url encoding. This means 32 code verifier bytes
     * encoded will be 43 bytes, or 96 bytes encoded will be 128 bytes. So 96 bytes
     * is the highest valid value that can be used.
     */
    exports.RECOMMENDED_CODE_VERIFIER_LENGTH = 96;
    /**
     * A sensible length for the state's length, for anti-csrf.
     */
    exports.RECOMMENDED_STATE_LENGTH = 32;
    /**
     * Character set to generate code verifier defined in rfc7636.
     */
    var PKCE_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    /**
     * OAuth 2.0 client that ONLY supports authorization code flow, with PKCE.
     *
     * Many applications structure their OAuth usage in different ways. This class
     * aims to provide both flexible and easy ways to use this configuration of
     * OAuth.
     *
     * See `example.ts` for how you'd typically use this.
     *
     * For others, review this class's methods.
     */
    var OAuth2AuthCodePKCE = /** @class */ (function () {
        function OAuth2AuthCodePKCE(config) {
            this.state = {};
            this.config = config;
            this.recoverState();
            return this;
        }
        /**
         * Attach the OAuth logic to all fetch requests and translate errors (either
         * returned as json or through the WWW-Authenticate header) into nice error
         * classes.
         */
        OAuth2AuthCodePKCE.prototype.decorateFetchHTTPClient = function (fetch) {
            var _this = this;
            return function (url, config) {
                var rest = [];
                for (var _i = 2; _i < arguments.length; _i++) {
                    rest[_i - 2] = arguments[_i];
                }
                if (!_this.state.isHTTPDecoratorActive) {
                    return fetch.apply(void 0, __spreadArrays([url, config], rest));
                }
                return _this
                    .getAccessToken()
                    .then(function (_a) {
                    var token = _a.token;
                    var configNew = Object.assign({}, config);
                    if (!configNew.headers) {
                        configNew.headers = {};
                    }
                    configNew.headers[HEADER_AUTHORIZATION] = "Bearer " + token.value;
                    return fetch.apply(void 0, __spreadArrays([url, configNew], rest));
                })
                    .then(function (res) {
                    if (res.ok) {
                        return res;
                    }
                    if (!res.headers.has(HEADER_WWW_AUTHENTICATE.toLowerCase())) {
                        return res;
                    }
                    var error = toErrorClass(fromWWWAuthenticateHeaderStringToObject(res.headers.get(HEADER_WWW_AUTHENTICATE.toLowerCase())).error);
                    if (error instanceof ErrorInvalidToken) {
                        _this.config
                            .onAccessTokenExpiry(function () { return _this.exchangeRefreshTokenForAccessToken(); });
                    }
                    return Promise.reject(error);
                });
            };
        };
        /**
         * If there is an error, it will be passed back as a rejected Promise.
         * If there is no code, the user should be redirected via
         * [fetchAuthorizationCode].
         */
        OAuth2AuthCodePKCE.prototype.isReturningFromAuthServer = function () {
            var error = OAuth2AuthCodePKCE.extractParamFromUrl(location.href, 'error');
            if (error) {
                return Promise.reject(toErrorClass(error));
            }
            var code = OAuth2AuthCodePKCE.extractParamFromUrl(location.href, 'code');
            if (!code) {
                return Promise.resolve(false);
            }
            var state = JSON.parse(localStorage.getItem(exports.LOCALSTORAGE_STATE) || '{}');
            var stateQueryParam = OAuth2AuthCodePKCE.extractParamFromUrl(location.href, 'state');
            if (stateQueryParam !== state.stateQueryParam) {
                console.warn("state query string parameter doesn't match the one sent! Possible malicious activity somewhere.");
                return Promise.reject(new ErrorInvalidReturnedStateParam());
            }
            state.authorizationCode = code;
            state.hasAuthCodeBeenExchangedForAccessToken = false;
            localStorage.setItem(exports.LOCALSTORAGE_STATE, JSON.stringify(state));
            this.setState(state);
            return Promise.resolve(true);
        };
        /**
         * Fetch an authorization grant via redirection. In a sense this function
         * doesn't return because of the redirect behavior (uses `location.replace`).
         *
         * @param oneTimeParams A way to specify "one time" used query string
         * parameters during the authorization code fetching process, usually for
         * values which need to change at run-time.
         */
        OAuth2AuthCodePKCE.prototype.fetchAuthorizationCode = function (oneTimeParams) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, clientId, extraAuthorizationParams, redirectUrl, scopes, _b, codeChallenge, codeVerifier, stateQueryParam, url, extraParameters;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            this.assertStateAndConfigArePresent();
                            _a = this.config, clientId = _a.clientId, extraAuthorizationParams = _a.extraAuthorizationParams, redirectUrl = _a.redirectUrl, scopes = _a.scopes;
                            return [4 /*yield*/, OAuth2AuthCodePKCE
                                    .generatePKCECodes()];
                        case 1:
                            _b = _c.sent(), codeChallenge = _b.codeChallenge, codeVerifier = _b.codeVerifier;
                            stateQueryParam = OAuth2AuthCodePKCE
                                .generateRandomState(exports.RECOMMENDED_STATE_LENGTH);
                            this.state = __assign(__assign({}, this.state), { codeChallenge: codeChallenge,
                                codeVerifier: codeVerifier,
                                stateQueryParam: stateQueryParam, isHTTPDecoratorActive: true });
                            localStorage.setItem(exports.LOCALSTORAGE_STATE, JSON.stringify(this.state));
                            url = this.config.authorizationUrl
                                + "?response_type=code&"
                                + ("client_id=" + encodeURIComponent(clientId) + "&")
                                + ("redirect_uri=" + encodeURIComponent(redirectUrl) + "&")
                                + ("scope=" + encodeURIComponent(scopes.join(' ')) + "&")
                                + ("state=" + stateQueryParam + "&")
                                + ("code_challenge=" + encodeURIComponent(codeChallenge) + "&")
                                + "code_challenge_method=S256";
                            if (extraAuthorizationParams || oneTimeParams) {
                                extraParameters = __assign(__assign({}, extraAuthorizationParams), oneTimeParams);
                                url = url + "&" + OAuth2AuthCodePKCE.objectToQueryString(extraParameters);
                            }
                            location.replace(url);
                            return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Tries to get the current access token. If there is none
         * it will fetch another one. If it is expired, it will fire
         * [onAccessTokenExpiry] but it's up to the user to call the refresh token
         * function. This is because sometimes not using the refresh token facilities
         * is easier.
         */
        OAuth2AuthCodePKCE.prototype.getAccessToken = function () {
            var _this = this;
            this.assertStateAndConfigArePresent();
            var onAccessTokenExpiry = this.config.onAccessTokenExpiry;
            var _a = this.state, accessToken = _a.accessToken, authorizationCode = _a.authorizationCode, explicitlyExposedTokens = _a.explicitlyExposedTokens, hasAuthCodeBeenExchangedForAccessToken = _a.hasAuthCodeBeenExchangedForAccessToken, refreshToken = _a.refreshToken, scopes = _a.scopes;
            if (!authorizationCode) {
                return Promise.reject(new ErrorNoAuthCode());
            }
            if (this.authCodeForAccessTokenRequest) {
                return this.authCodeForAccessTokenRequest;
            }
            if (!this.isAuthorized() || !hasAuthCodeBeenExchangedForAccessToken) {
                this.authCodeForAccessTokenRequest = this.exchangeAuthCodeForAccessToken();
                return this.authCodeForAccessTokenRequest;
            }
            // Depending on the server (and config), refreshToken may not be available.
            if (refreshToken && this.isAccessTokenExpired()) {
                return onAccessTokenExpiry(function () { return _this.exchangeRefreshTokenForAccessToken(); });
            }
            return Promise.resolve({
                token: accessToken,
                explicitlyExposedTokens: explicitlyExposedTokens,
                scopes: scopes,
                refreshToken: refreshToken
            });
        };
        /**
         * Refresh an access token from the remote service.
         */
        OAuth2AuthCodePKCE.prototype.exchangeRefreshTokenForAccessToken = function () {
            var _this = this;
            var _a;
            this.assertStateAndConfigArePresent();
            var _b = this.config, extraRefreshParams = _b.extraRefreshParams, clientId = _b.clientId, tokenUrl = _b.tokenUrl;
            var refreshToken = this.state.refreshToken;
            if (!refreshToken) {
                console.warn('No refresh token is present.');
            }
            var url = tokenUrl;
            var body = "grant_type=refresh_token&"
                + ("refresh_token=" + ((_a = refreshToken) === null || _a === void 0 ? void 0 : _a.value) + "&")
                + ("client_id=" + clientId);
            if (extraRefreshParams) {
                body = url + "&" + OAuth2AuthCodePKCE.objectToQueryString(extraRefreshParams);
            }
            return fetch(url, {
                method: 'POST',
                body: body,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            })
                .then(function (res) { return res.status >= 400 ? res.json().then(function (data) { return Promise.reject(data); }) : res.json(); })
                .then(function (json) {
                var access_token = json.access_token, expires_in = json.expires_in, refresh_token = json.refresh_token, scope = json.scope;
                var explicitlyExposedTokens = _this.config.explicitlyExposedTokens;
                var scopes = [];
                var tokensToExpose = {};
                var accessToken = {
                    value: access_token,
                    expiry: (new Date(Date.now() + (parseInt(expires_in) * 1000))).toString()
                };
                _this.state.accessToken = accessToken;
                if (refresh_token) {
                    var refreshToken_1 = {
                        value: refresh_token
                    };
                    _this.state.refreshToken = refreshToken_1;
                }
                if (explicitlyExposedTokens) {
                    tokensToExpose = Object.fromEntries(explicitlyExposedTokens
                        .map(function (tokenName) { return [tokenName, json[tokenName]]; })
                        .filter(function (_a) {
                        _a[0]; var tokenValue = _a[1];
                        return tokenValue !== undefined;
                    }));
                    _this.state.explicitlyExposedTokens = tokensToExpose;
                }
                if (scope) {
                    // Multiple scopes are passed and delimited by spaces,
                    // despite using the singular name "scope".
                    scopes = scope.split(' ');
                    _this.state.scopes = scopes;
                }
                localStorage.setItem(exports.LOCALSTORAGE_STATE, JSON.stringify(_this.state));
                var accessContext = { token: accessToken, scopes: scopes };
                if (explicitlyExposedTokens) {
                    accessContext.explicitlyExposedTokens = tokensToExpose;
                }
                return accessContext;
            })
                .catch(function (data) {
                var onInvalidGrant = _this.config.onInvalidGrant;
                var error = data.error || 'There was a network error.';
                switch (error) {
                    case 'invalid_grant':
                        onInvalidGrant(function () { return _this.fetchAuthorizationCode(); });
                        break;
                }
                return Promise.reject(toErrorClass(error));
            });
        };
        /**
         * Get the scopes that were granted by the authorization server.
         */
        OAuth2AuthCodePKCE.prototype.getGrantedScopes = function () {
            return this.state.scopes;
        };
        /**
         * Signals if OAuth HTTP decorating should be active or not.
         */
        OAuth2AuthCodePKCE.prototype.isHTTPDecoratorActive = function (isActive) {
            this.state.isHTTPDecoratorActive = isActive;
            localStorage.setItem(exports.LOCALSTORAGE_STATE, JSON.stringify(this.state));
        };
        /**
         * Tells if the client is authorized or not. This means the client has at
         * least once successfully fetched an access token. The access token could be
         * expired.
         */
        OAuth2AuthCodePKCE.prototype.isAuthorized = function () {
            return !!this.state.accessToken;
        };
        /**
         * Checks to see if the access token has expired.
         */
        OAuth2AuthCodePKCE.prototype.isAccessTokenExpired = function () {
            var accessToken = this.state.accessToken;
            return Boolean(accessToken && (new Date()) >= (new Date(accessToken.expiry)));
        };
        /**
         * Resets the state of the client. Equivalent to "logging out" the user.
         */
        OAuth2AuthCodePKCE.prototype.reset = function () {
            this.setState({});
            this.authCodeForAccessTokenRequest = undefined;
        };
        /**
         * If the state or config are missing, it means the client is in a bad state.
         * This should never happen, but the check is there just in case.
         */
        OAuth2AuthCodePKCE.prototype.assertStateAndConfigArePresent = function () {
            if (!this.state || !this.config) {
                console.error('state:', this.state, 'config:', this.config);
                throw new Error('state or config is not set.');
            }
        };
        /**
         * Fetch an access token from the remote service. You may pass a custom
         * authorization grant code for any reason, but this is non-standard usage.
         */
        OAuth2AuthCodePKCE.prototype.exchangeAuthCodeForAccessToken = function (codeOverride) {
            var _this = this;
            this.assertStateAndConfigArePresent();
            var _a = this.state, _b = _a.authorizationCode, authorizationCode = _b === void 0 ? codeOverride : _b, _c = _a.codeVerifier, codeVerifier = _c === void 0 ? '' : _c;
            var _d = this.config, clientId = _d.clientId, onInvalidGrant = _d.onInvalidGrant, redirectUrl = _d.redirectUrl;
            if (!codeVerifier) {
                console.warn('No code verifier is being sent.');
            }
            else if (!authorizationCode) {
                console.warn('No authorization grant code is being passed.');
            }
            var url = this.config.tokenUrl;
            var body = "grant_type=authorization_code&"
                + ("code=" + encodeURIComponent(authorizationCode || '') + "&")
                + ("redirect_uri=" + encodeURIComponent(redirectUrl) + "&")
                + ("client_id=" + encodeURIComponent(clientId) + "&")
                + ("code_verifier=" + codeVerifier);
            return fetch(url, {
                method: 'POST',
                body: body,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            })
                .then(function (res) {
                var jsonPromise = res.json()
                    .catch(function (_) { return ({ error: 'invalid_json' }); });
                if (!res.ok) {
                    return jsonPromise.then(function (_a) {
                        var error = _a.error;
                        switch (error) {
                            case 'invalid_grant':
                                onInvalidGrant(function () { return _this.fetchAuthorizationCode(); });
                                break;
                        }
                        return Promise.reject(toErrorClass(error));
                    });
                }
                return jsonPromise.then(function (json) {
                    var access_token = json.access_token, expires_in = json.expires_in, refresh_token = json.refresh_token, scope = json.scope;
                    var explicitlyExposedTokens = _this.config.explicitlyExposedTokens;
                    var scopes = [];
                    var tokensToExpose = {};
                    _this.state.hasAuthCodeBeenExchangedForAccessToken = true;
                    _this.authCodeForAccessTokenRequest = undefined;
                    var accessToken = {
                        value: access_token,
                        expiry: (new Date(Date.now() + (parseInt(expires_in) * 1000))).toString()
                    };
                    _this.state.accessToken = accessToken;
                    if (refresh_token) {
                        var refreshToken = {
                            value: refresh_token
                        };
                        _this.state.refreshToken = refreshToken;
                    }
                    if (explicitlyExposedTokens) {
                        tokensToExpose = Object.fromEntries(explicitlyExposedTokens
                            .map(function (tokenName) { return [tokenName, json[tokenName]]; })
                            .filter(function (_a) {
                            _a[0]; var tokenValue = _a[1];
                            return tokenValue !== undefined;
                        }));
                        _this.state.explicitlyExposedTokens = tokensToExpose;
                    }
                    if (scope) {
                        // Multiple scopes are passed and delimited by spaces,
                        // despite using the singular name "scope".
                        scopes = scope.split(' ');
                        _this.state.scopes = scopes;
                    }
                    localStorage.setItem(exports.LOCALSTORAGE_STATE, JSON.stringify(_this.state));
                    var accessContext = { token: accessToken, scopes: scopes };
                    if (explicitlyExposedTokens) {
                        accessContext.explicitlyExposedTokens = tokensToExpose;
                    }
                    return accessContext;
                });
            });
        };
        OAuth2AuthCodePKCE.prototype.recoverState = function () {
            this.state = JSON.parse(localStorage.getItem(exports.LOCALSTORAGE_STATE) || '{}');
            return this;
        };
        OAuth2AuthCodePKCE.prototype.setState = function (state) {
            this.state = state;
            localStorage.setItem(exports.LOCALSTORAGE_STATE, JSON.stringify(state));
            return this;
        };
        /**
         * Implements *base64url-encode* (RFC 4648 § 5) without padding, which is NOT
         * the same as regular base64 encoding.
         */
        OAuth2AuthCodePKCE.base64urlEncode = function (value) {
            var base64 = btoa(value);
            base64 = base64.replace(/\+/g, '-');
            base64 = base64.replace(/\//g, '_');
            base64 = base64.replace(/=/g, '');
            return base64;
        };
        /**
         * Extracts a query string parameter.
         */
        OAuth2AuthCodePKCE.extractParamFromUrl = function (url, param) {
            var queryString = url.split('?');
            if (queryString.length < 2) {
                return '';
            }
            // Account for hash URLs that SPAs usually use.
            queryString = queryString[1].split('#');
            var parts = queryString[0]
                .split('&')
                .reduce(function (a, s) { return a.concat(s.split('=')); }, []);
            if (parts.length < 2) {
                return '';
            }
            var paramIdx = parts.indexOf(param);
            return decodeURIComponent(paramIdx >= 0 ? parts[paramIdx + 1] : '');
        };
        /**
         * Converts the keys and values of an object to a url query string
         */
        OAuth2AuthCodePKCE.objectToQueryString = function (dict) {
            return Object.entries(dict).map(function (_a) {
                var key = _a[0], val = _a[1];
                return key + "=" + encodeURIComponent(val);
            }).join('&');
        };
        /**
         * Generates a code_verifier and code_challenge, as specified in rfc7636.
         */
        OAuth2AuthCodePKCE.generatePKCECodes = function () {
            var output = new Uint32Array(exports.RECOMMENDED_CODE_VERIFIER_LENGTH);
            crypto.getRandomValues(output);
            var codeVerifier = OAuth2AuthCodePKCE.base64urlEncode(Array
                .from(output)
                .map(function (num) { return PKCE_CHARSET[num % PKCE_CHARSET.length]; })
                .join(''));
            return crypto
                .subtle
                .digest('SHA-256', (new TextEncoder()).encode(codeVerifier))
                .then(function (buffer) {
                var hash = new Uint8Array(buffer);
                var binary = '';
                var hashLength = hash.byteLength;
                for (var i = 0; i < hashLength; i++) {
                    binary += String.fromCharCode(hash[i]);
                }
                return binary;
            })
                .then(OAuth2AuthCodePKCE.base64urlEncode)
                .then(function (codeChallenge) { return ({ codeChallenge: codeChallenge, codeVerifier: codeVerifier }); });
        };
        /**
         * Generates random state to be passed for anti-csrf.
         */
        OAuth2AuthCodePKCE.generateRandomState = function (lengthOfState) {
            var output = new Uint32Array(lengthOfState);
            crypto.getRandomValues(output);
            return Array
                .from(output)
                .map(function (num) { return PKCE_CHARSET[num % PKCE_CHARSET.length]; })
                .join('');
        };
        return OAuth2AuthCodePKCE;
    }());
    exports.OAuth2AuthCodePKCE = OAuth2AuthCodePKCE;
    }(oauth2AuthCodePkce));

    const lichessHost = 'https://lichess.org';
    const clientId = 'example.com';
    const clientUrl = (() => {
        const url = new URL(`${location.protocol}//${location.host}/obtain`);
        url.search = '';
        return url.href;
    })();
    class Ctrl {
        constructor(redraw, homeUrl) {
            this.redraw = redraw;
            this.homeUrl = homeUrl;
            this.oauth = new oauth2AuthCodePkce.OAuth2AuthCodePKCE({
                authorizationUrl: `${lichessHost}/oauth`,
                tokenUrl: `${lichessHost}/api/token`,
                clientId,
                scopes: ['email:read'],
                redirectUrl: clientUrl,
                onAccessTokenExpiry: refreshAccessToken => refreshAccessToken(),
                onInvalidGrant: _retry => { },
            });
            this.useApiRaw();
        }
        async login() {
            // Redirect to authentication prompt.
            await this.oauth.fetchAuthorizationCode();
        }
        async init() {
            try {
                const hasAuthCode = await this.oauth.isReturningFromAuthServer();
                if (hasAuthCode) {
                    // Might want to persist accessContext.token until the user logs out.
                    this.accessContext = await this.oauth.getAccessToken();
                    this.redraw();
                    // Can also use this convenience wrapper for fetch() instead of
                    // using manually using getAccessToken() and setting the
                    // "Authorization: Bearer ..." header.
                    const fetch = this.oauth.decorateFetchHTTPClient(window.fetch);
                    //await this.useApi(fetch);
                    await this.useApiRaw();
                }
            }
            catch (err) {
                this.error = err;
                this.redraw();
            }
        }
        /*async useApi(fetch: HttpClient) {
          // Example request using @bity/oauth2-auth-code-pkce decorator:
          // Lookup email associated with the Lichess account.
          // Requests will fail with 401 Unauthorized if the access token expired
          // or was revoked. Make sure to offer a chance to reauthenticate.
          const res = await fetch(`${lichessHost}/api/account/email`);
          this.email = (await res.json()).email;
          this.redraw();
        }*/
        async useApiRaw() {
            var _a, _b, _c, _d;
            // Example request using @bity/oauth2-auth-code-pkce decorator:
            // Lookup email associated with the Lichess account.
            // Requests will fail with 401 Unauthorized if the access token expired
            // or was revoked. Make sure to offer a chance to reauthenticate.
            let res = await fetch(`${lichessHost}/api/account`, {
                headers: {
                    Authorization: `Bearer ${((_b = (_a = this.accessContext) === null || _a === void 0 ? void 0 : _a.token) === null || _b === void 0 ? void 0 : _b.value) || localStorage.getItem("LICHESS_TOKEN")}`
                }
            });
            this.username = (await res.json()).username;
            res = await fetch(`${lichessHost}/api/account/email`, {
                headers: {
                    Authorization: `Bearer ${((_d = (_c = this.accessContext) === null || _c === void 0 ? void 0 : _c.token) === null || _d === void 0 ? void 0 : _d.value) || localStorage.getItem("LICHESS_TOKEN")}`
                }
            });
            this.email = (await res.json()).email;
            this.redraw();
        }
        async logout() {
            var _a, _b;            

            const token = ((_b = (_a = this.accessContext) === null || _a === void 0 ? void 0 : _a.token) === null || _b === void 0 ? void 0 : _b.value) || localStorage.getItem("LICHESS_TOKEN");
            
            localStorage.removeItem("LICHESS_TOKEN");

            this.accessContext = undefined;
            this.error = undefined;
            this.username = undefined;
            this.email = undefined;
            this.redraw();
            // Example request using vanilla fetch: Revoke access token.
            const response = await fetch(`${lichessHost}/api/token`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            try{
              const showresponse = JSON.stringify(response)

              window.alert(`Logged out. Token revoked.`)
            }catch(err){
              window.alert(`Logged out. There was a problem revoking token, API response was ${showresponse}.`)
            }

            
        }
    }

    function view(ctrl) {
        var _a, _b, _c, _d;
        let token = ((_a = ctrl.accessContext) === null || _a === void 0 ? void 0 : _a.token) ? (_c = (_b = ctrl.accessContext) === null || _b === void 0 ? void 0 : _b.token) === null || _c === void 0 ? void 0 : _c.value : localStorage.getItem("LICHESS_TOKEN");
        if (token) {
            localStorage.setItem("LICHESS_TOKEN", token);
        }
        return h('table', [
            h('tr', [
                h('td', 'Back to home'),
                h('td', [
                    h('a', {
                        attrs: {
                            href: ctrl.homeUrl
                        }
                    }, ctrl.homeUrl)
                ]),
            ]),
            h('tr', [h('td', 'Lichess Host'), h('td', lichessHost)]),
            h('tr', [h('td', 'Client URL'), h('td', clientUrl)]),
            h('tr', [h('td', 'Error'), h('td', (_d = ctrl.error) === null || _d === void 0 ? void 0 : _d.toString())]),
            h('tr', [h('td', 'Access token (secret)'), h('td', token ? [
                    "token available  ",
                    h('button', {
                        on: { click: () => window.alert(`${token}`) },
                    }, 'Reveal token'),
                ] : "no token")]),
            h('tr', [h('td', 'Lichess account username'), h('td', ctrl.username)]),
            h('tr', [h('td', 'Lichess account email'), h('td', ctrl.email)]),
            h('tr', [
                h('td', ''),
                h('td', [
                    h('button', {
                        attrs: { disabled: !!token },
                        on: { click: () => ctrl.login() },
                    }, 'Login'),
                    ' ',
                    h('button', {
                        attrs: { disabled: !ctrl.error && !token },
                        on: { click: () => ctrl.logout() },
                    }, ctrl.accessContext || token ? 'Logout' : 'Reset'),
                ]),
            ]),
        ]);
    }

    function main (element, homeUrl) {
        const patch = init([attributesModule, eventListenersModule]);
        const ctrl = new Ctrl(redraw, homeUrl);
        let vnode = patch(element, view(ctrl));
        function redraw() {
            vnode = patch(vnode, view(ctrl));
        }
        ctrl.init();
    }

    return main;

}());

export default ExampleApp