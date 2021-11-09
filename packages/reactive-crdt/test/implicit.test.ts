import { autorun, Observer, reactive } from "@reactivedata/reactive";
import { Y, crdt, boxed } from "@reactivedata/reactive-crdt";
import { Box } from "../src/boxed";

describe("test implicit observer", () => {
  type StoreType = {
    arr: number[];
    object: {
      nested?: number;
    };
    todos: Box<{ text: string; completed: boolean }>[];
    todosNotBoxed: { text: string; completed: boolean }[];
    xml: Y.XmlFragment;
  };

  let fnSpy1: jest.Mock<void, []>;
  let fnSpy2: jest.Mock<void, []>;
  let implicitStore1: StoreType;
  let implicitStore2: StoreType;
  let doc1: Y.Doc;
  let doc2: Y.Doc;
  let storeDoc2: StoreType;
  let store: StoreType;
  beforeEach(() => {
    fnSpy1 = jest.fn(() => {
      debugger;
    });
    fnSpy2 = jest.fn(() => {});

    doc1 = new Y.Doc();
    doc2 = new Y.Doc();

    store = crdt(doc1, {
      arr: [],
      object: {} as { nested?: number },
      todos: [],
      todosNotBoxed: [],
      xml: "xml" as "xml",
    });

    implicitStore1 = reactive(store, new Observer(fnSpy1));
    implicitStore2 = reactive(store, new Observer(fnSpy2));

    storeDoc2 = crdt(doc2, {
      arr: [],
      object: {} as { nested?: number },
      todos: [],
      todosNotBoxed: [],
      xml: "xml" as "xml",
    });
  });

  it("implicit works with push and filter", () => {
    let x = implicitStore1.arr!.filter((v) => v);
    implicitStore1.arr.push(1);

    expect(fnSpy1).toBeCalledTimes(1);
    expect(fnSpy2).toBeCalledTimes(0);

    implicitStore2.arr.filter((v) => v);
    implicitStore1.arr.push(1);

    expect(fnSpy1).toBeCalledTimes(2);
    expect(fnSpy2).toBeCalledTimes(1);
  });

  it("implicit works with get and push", () => {
    let x = implicitStore1.arr[1];
    implicitStore1.arr.push(1);

    expect(fnSpy1).toBeCalledTimes(1);
    expect(fnSpy2).toBeCalledTimes(0);

    x = implicitStore2.arr[1];
    implicitStore1.arr.push(1);

    expect(fnSpy1).toBeCalledTimes(2);
    expect(fnSpy2).toBeCalledTimes(1);
  });

  it("implicit works with get and set", () => {
    let x = implicitStore1.arr[0];
    implicitStore1.arr[0] = 9;

    expect(fnSpy1).toBeCalledTimes(1);
    expect(fnSpy2).toBeCalledTimes(0);

    x = implicitStore2.arr[0];
    implicitStore1.arr[0] = 10;

    expect(fnSpy1).toBeCalledTimes(2);
    expect(fnSpy2).toBeCalledTimes(1);
  });

  // TODO: This test has known (non-breaking) issues demonstrating observers are called twice
  it("implicit works with nested objects", () => {
    let x = implicitStore1.object.nested;
    implicitStore1.object.nested = 10;

    expect(fnSpy1).toBeCalledTimes(1);
    expect(fnSpy2).toBeCalledTimes(0);

    x = implicitStore2.object.nested;
    implicitStore1.object.nested = 11;

    expect(fnSpy1).toBeCalledTimes(2);
    expect(fnSpy2).toBeCalledTimes(1);
  });

  it("implicit works with xml", () => {
    let x = implicitStore1.xml;

    expect(fnSpy1).toBeCalledTimes(0);
    expect(fnSpy2).toBeCalledTimes(0);

    let child = implicitStore2.xml.firstChild?.toDOM;
    const newEl = new Y.XmlElement("p");
    newEl.push([new Y.XmlText("text")]);
    implicitStore1.xml.push([newEl]);

    expect(fnSpy1).toBeCalledTimes(0);
    expect(fnSpy2).toBeCalledTimes(1);

    expect(implicitStore2.xml.toString()).toBe("<p>text</p>");
  });

  it("implicit works with json stringify", () => {
    let x = JSON.stringify(implicitStore1);

    expect(fnSpy1).toBeCalledTimes(0);

    implicitStore1.arr[0] = 9;

    expect(fnSpy1).toBeCalledTimes(1);
  });

  it("implicit works with json stringify nested", () => {
    let x = JSON.stringify(implicitStore1);

    expect(fnSpy1).toBeCalledTimes(0);

    implicitStore1.object.nested = 3;

    expect(fnSpy1).toBeCalledTimes(1);

    implicitStore1.object.nested = 4;

    expect(fnSpy1).toBeCalledTimes(2);
  });

  it("autorun works with json stringify and remote document", () => {
    const fn = jest.fn();
    autorun(() => {
      let x = JSON.stringify(implicitStore1);
      fn();
    });

    expect(fn).toBeCalledTimes(1);

    const todos = store.todos;

    expect(fn).toBeCalledTimes(2); // called because array will be initialized

    todos.push(boxed({ text: "hello", completed: false }));

    expect(fn).toBeCalledTimes(3);

    storeDoc2.todos.push(boxed({ text: "hello2", completed: false }));

    expect(fn).toBeCalledTimes(3);

    const update = Y.encodeStateAsUpdate(doc2);
    Y.applyUpdate(doc1, update);

    expect(fn).toBeCalledTimes(4); // should be 1

    implicitStore2.object.nested = 4;

    expect(fn).toBeCalledTimes(5); // should be 2
  });

  it("autorun works with json stringify and remote document and nested change", () => {
    const fn = jest.fn();
    autorun(() => {
      let x = JSON.stringify(implicitStore1);
      fn();
    });

    expect(fn).toBeCalledTimes(1);

    const todos = store.todosNotBoxed;

    expect(fn).toBeCalledTimes(2); // called because array will be initialized

    todos.push({ text: "hello", completed: false });

    expect(fn).toBeCalledTimes(3);

    const update = Y.encodeStateAsUpdate(doc1);
    Y.applyUpdate(doc2, update);

    expect(fn).toBeCalledTimes(3);

    storeDoc2.todosNotBoxed[0].completed = true;

    expect(fn).toBeCalledTimes(3);

    const update2 = Y.encodeStateAsUpdate(doc2);
    Y.applyUpdate(doc1, update2);

    expect(fn).toBeCalledTimes(4); // should be 1

    implicitStore2.object.nested = 4;

    expect(fn).toBeCalledTimes(5); // should be 2
  });
});
