import './types';
import { DummyDocument } from './dummy/dummy-document';
import { DocumentFragmentImpl } from './document-fragment';
import { ElementImpl } from './element';
import { NamedNodeMapImpl } from './named-node-map';
import { TextImpl } from './text';
import { CommentImpl } from './comment';
import { CDATASectionImpl } from './cdata-section';
import { ProcessingInstructionImpl } from './processing-instruction';
import { AttrImpl } from './attr';
import { EntityReferenceImpl } from './entity-reference';
import { NodeTypeTS } from './node-types';
import { isDocumentFragment, isElement, asHTMLElement, asChildNode } from './utils';

import { _insertBefore, _removeChild, _visitNode, importNode } from './document-utils';
import { MutableChildNode } from './types';
import { NodeListOfImpl } from './node-list-of';
import { LiveNodeListImpl } from './live-node-list';

export class DocumentImpl extends DummyDocument {
  implementation: DOMImplementation;

  doctype: DocumentType | null = null;
  documentURI: string;
  documentElement: HTMLElement = null as never;
  _inc: number = 1;

  constructor() {
    super();
    this.nodeName = '#document';
    this.nodeType = NodeTypeTS.DOCUMENT_NODE;
  }

  insertBefore<T extends Node>(newChild: T, refChild: Node | null): T {
    //raises
    if (isDocumentFragment(newChild)) {
      let child = newChild.firstChild;
      while (child) {
        const next = child.nextSibling;
        this.insertBefore(child, refChild);
        child = next;
      }
      return newChild;
    }
    if (this.documentElement == null && isElement(newChild)) {
      this.documentElement = asHTMLElement(newChild);
    }

    return (
      _insertBefore(this, asChildNode(newChild), refChild == null ? null : asChildNode(refChild)),
      ((asChildNode(newChild) as MutableChildNode).ownerDocument = this),
      newChild
    );
  }
  removeChild<T extends Node>(oldChild: T): T {
    if ((this.documentElement as unknown) === oldChild) {
      this.documentElement = null as never;
    }
    return _removeChild(this, oldChild);
  }
  // Introduced in DOM Level 2:
  importNode<T extends Node>(importedNode: T, deep: boolean): T {
    return importNode(this, importedNode, deep);
  }

  // Introduced in DOM Level 2:
  getElementById(id: string) {
    let rtv: Element | null = null;
    _visitNode(this.documentElement, function(node: Node) {
      if (isElement(node)) {
        if (node.getAttribute('id') == id) {
          rtv = node;
          return true;
        }
      }
    });
    return rtv;
  }

  getElementsByTagName(tagName: string): any {
    return new LiveNodeListImpl<Element>(this, function(base) {
      let ls: Element[] = [];

      _visitNode(base, function(node) {
        if (node !== base && isElement(node) && (tagName === '*' || node.tagName == tagName)) {
          ls.push(node);
        }
      });
      return ls;
    });
  }

  getElementsByTagNameNS(namespaceURI: string, localName: string): any {
    return new LiveNodeListImpl<Element>(this, function(base) {
      let ls: Element[] = [];
      _visitNode(base, function(node) {
        if (
          node !== base &&
          isElement(node) &&
          (namespaceURI === '*' || node.namespaceURI === namespaceURI) &&
          (localName === '*' || node.localName == localName)
        ) {
          ls.push(node);
        }
      });
      return ls;
    });
  }

  //document factory method:
  createElement(tagName: string) {
    const node = new ElementImpl();
    node.ownerDocument = this;
    node.nodeName = tagName;
    node.tagName = tagName;
    node.childNodes = new NodeListOfImpl();
    const attrs = (node.attributes = new NamedNodeMapImpl());
    attrs._ownerElement = node;
    return node;
  }
  createDocumentFragment() {
    const node = new DocumentFragmentImpl();
    node.ownerDocument = this;
    node.childNodes = new NodeListOfImpl();
    return node;
  }
  createTextNode(data: string) {
    const node = new TextImpl();
    node.ownerDocument = this;
    node.appendData(data);
    return node;
  }

  createComment(data: string) {
    const node = new CommentImpl();
    node.ownerDocument = this;
    node.appendData(data);
    return node;
  }
  createCDATASection(data: string) {
    const node = new CDATASectionImpl();
    node.ownerDocument = this;
    node.appendData(data);
    return node;
  }
  createProcessingInstruction(target: string, data: string) {
    const node = new ProcessingInstructionImpl();
    node.ownerDocument = this;
    node.tagName = node.target = target;
    node.nodeValue = node.data = data;
    return node;
  }
  createAttribute(name: string) {
    const node = new AttrImpl();
    node.ownerDocument = this;
    node.name = name;
    node.nodeName = name;
    node.localName = name;
    node.specified = true;
    return node;
  }
  createEntityReference(name: string) {
    const node = new EntityReferenceImpl();
    node.ownerDocument = this;
    node.nodeName = name;
    return node;
  }

  // Introduced in DOM Level 2:
  createElementNS(namespaceURI: string, qualifiedName: string): any {
    const node = new ElementImpl();
    const pl = qualifiedName.split(':');
    const attrs = (node.attributes = new NamedNodeMapImpl());
    node.childNodes = new NodeListOfImpl();
    node.ownerDocument = this;
    node.nodeName = qualifiedName;
    node.tagName = qualifiedName;
    node.namespaceURI = namespaceURI;
    if (pl.length == 2) {
      node.prefix = pl[0];
      node.localName = pl[1];
    } else {
      //el.prefix = null;
      node.localName = qualifiedName;
    }
    attrs._ownerElement = node;
    return node;
  }
  // Introduced in DOM Level 2:
  createAttributeNS(namespaceURI: string, qualifiedName: string) {
    const node = new AttrImpl();
    const pl = qualifiedName.split(':');
    node.ownerDocument = this;
    node.nodeName = qualifiedName;
    node.name = qualifiedName;
    node.namespaceURI = namespaceURI;
    node.specified = true;
    if (pl.length == 2) {
      node.prefix = pl[0];
      node.localName = pl[1];
    } else {
      //el.prefix = null;
      node.localName = qualifiedName;
    }
    return node;
  }
}