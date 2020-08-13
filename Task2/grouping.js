function init() {
    if (window.goSamples) goSamples();  // init for these samples -- you don't need to call this
    var $ = go.GraphObject.make;  //for conciseness in defining node templates

    myDiagram =
        $(go.Diagram, "myDiagramDiv",  //Diagram refers to its DIV HTML element by id
            { "undoManager.isEnabled": true });

    // when the document is modified, add a "*" to the title and enable the "Save" button
    myDiagram.addDiagramListener("Modified", function (e) {
        var button = document.getElementById("SaveButton");
        if (button) button.disabled = !myDiagram.isModified;
        var idx = document.title.indexOf("*");
        if (myDiagram.isModified) {
            if (idx < 0) document.title += "*";
        } else {
            if (idx >= 0) document.title = document.title.substr(0, idx);
        }
    });

    // To simplify this code we define a function for creating a context menu button:
    function makeButton(text, action, visiblePredicate) {
        return $("ContextMenuButton",
            $(go.TextBlock, text),
            { click: action },
            // don't bother with binding GraphObject.visible if there's no predicate
            visiblePredicate ? new go.Binding("visible", "", function (o, e) { return o.diagram ? visiblePredicate(o, e) : false; }).ofObject() : {});
    }

    var nodeMenu =  // context menu for each Node
        $("ContextMenu",
            makeButton("Copy",
                function (e, obj) { e.diagram.commandHandler.copySelection(); }),
            makeButton("Delete",
                function (e, obj) { e.diagram.commandHandler.deleteSelection(); }),
            $(go.Shape, "LineH", { strokeWidth: 2, height: 1, stretch: go.GraphObject.Horizontal }),
            makeButton("Add top port",
                function (e, obj) { addPort("top"); }),
            makeButton("Add left port",
                function (e, obj) { addPort("left"); }),
            makeButton("Add right port",
                function (e, obj) { addPort("right"); }),
            makeButton("Add bottom port",
                function (e, obj) { addPort("bottom"); })
        );

    var portSize = new go.Size(10, 10);

    var portMenu =  // context menu for each port
        $("ContextMenu",
            makeButton("Swap order",
                function (e, obj) { swapOrder(obj.part.adornedObject); }),
            makeButton("Remove port",
                // in the click event handler, the obj.part is the Adornment;
                // its adornedObject is the port
                function (e, obj) { removePort(obj.part.adornedObject); }),
            makeButton("Change color",
                function (e, obj) { changeColor(obj.part.adornedObject); }),
            makeButton("Remove side ports",
                function (e, obj) { removeAll(obj.part.adornedObject); })
        );

    // the node template
    // includes a panel on each side with an itemArray of panels containing ports
    myDiagram.nodeTemplate =
        $(go.Node, "Table",
            {
                locationObjectName: "BODY",
                locationSpot: go.Spot.Center,
                selectionObjectName: "BODY",
                contextMenu: nodeMenu
            },
            new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),

            // the body
            $(go.Panel, "Auto",
                {
                    row: 1, column: 1, name: "BODY",
                    stretch: go.GraphObject.Fill
                },
                $(go.Shape, "RoundedRectangle",
                    {
                        fill: "#dbf6cb", stroke: null, strokeWidth: 0,
                        minSize: new go.Size(80, 80)
                    }),
                $(go.TextBlock,
                    { margin: 10, textAlign: "center", font: "bold 14px Segoe UI,sans-serif", stroke: "#484848", editable: true },
                    new go.Binding("text", "name").makeTwoWay())
            ),  // end Auto Panel body

            // the Panel holding the left port elements, which are themselves Panels,
            // created for each item in the itemArray, bound to data.leftArray
            $(go.Panel, "Vertical",
                new go.Binding("itemArray", "leftArray"),
                {
                    row: 1, column: 0,
                    itemTemplate:
                        $(go.Panel,
                            {
                                _side: "left",  // internal property to make it easier to tell which side it's on
                                fromSpot: go.Spot.Left, toSpot: go.Spot.Left,
                                fromLinkable: true, toLinkable: true, cursor: "pointer",
                                contextMenu: portMenu
                            },
                            new go.Binding("portId", "portId"),
                            $(go.Shape, "Rectangle",
                                {
                                    stroke: null, strokeWidth: 0,
                                    desiredSize: portSize,
                                    margin: new go.Margin(1, 0)
                                },
                                new go.Binding("fill", "portColor")),
                        )  // end itemTemplate
                }
            ),  // end Vertical Panel

            // the Panel holding the top port elements, which are themselves Panels,
            // created for each item in the itemArray, bound to data.topArray
            $(go.Panel, "Horizontal",
                new go.Binding("itemArray", "topArray"),
                {
                    row: 0, column: 1,
                    itemTemplate:
                        $(go.Panel,
                            {
                                _side: "top",
                                fromSpot: go.Spot.Top, toSpot: go.Spot.Top,
                                fromLinkable: true, toLinkable: true, cursor: "pointer",
                                contextMenu: portMenu
                            },
                            new go.Binding("portId", "portId"),
                            $(go.Shape, "Rectangle",
                                {
                                    stroke: null, strokeWidth: 0,
                                    desiredSize: portSize,
                                    margin: new go.Margin(0, 1)
                                },
                                new go.Binding("fill", "portColor"))
                        )  // end itemTemplate
                }
            ),  // end Horizontal Panel

            // the Panel holding the right port elements, which are themselves Panels,
            // created for each item in the itemArray, bound to data.rightArray
            $(go.Panel, "Vertical",
                new go.Binding("itemArray", "rightArray"),
                {
                    row: 1, column: 2,
                    itemTemplate:
                        $(go.Panel,
                            {
                                _side: "right",
                                fromSpot: go.Spot.Right, toSpot: go.Spot.Right,
                                fromLinkable: true, toLinkable: true, cursor: "pointer",
                                contextMenu: portMenu
                            },
                            new go.Binding("portId", "portId"),
                            $(go.Shape, "Rectangle",
                                {
                                    stroke: null, strokeWidth: 0,
                                    desiredSize: portSize,
                                    margin: new go.Margin(1, 0)
                                },
                                new go.Binding("fill", "portColor"))
                        )  // end itemTemplate
                }
            ),  // end Vertical Panel

            // the Panel holding the bottom port elements, which are themselves Panels,
            // created for each item in the itemArray, bound to data.bottomArray
            $(go.Panel, "Horizontal",
                new go.Binding("itemArray", "bottomArray"),
                {
                    row: 2, column: 1,
                    itemTemplate:
                        $(go.Panel,
                            {
                                _side: "bottom",
                                fromSpot: go.Spot.Bottom, toSpot: go.Spot.Bottom,
                                fromLinkable: true, toLinkable: true, cursor: "pointer",
                                contextMenu: portMenu
                            },
                            new go.Binding("portId", "portId"),
                            $(go.Shape, "Rectangle",
                                {
                                    stroke: null, strokeWidth: 0,
                                    desiredSize: portSize,
                                    margin: new go.Margin(0, 1)
                                },
                                new go.Binding("fill", "portColor"))
                        )  // end itemTemplate
                }
            ),  // end Horizontal Panel
        );  // end Node

    // an orthogonal link template, reshapable and relinkable
    myDiagram.linkTemplate =
        $(go.Link,  // defined below
            {
                routing: go.Link.AvoidsNodes,
                corner: 4,
                curve: go.Link.JumpGap,
                reshapable: true,
                resegmentable: true,
                relinkableFrom: true,
                relinkableTo: true
            },
            new go.Binding("points").makeTwoWay(),
            $(go.Shape, { stroke: "#2F4F4F", strokeWidth: 2 })
        );

    // support double-clicking in the background to add a copy of this data as a node
    myDiagram.toolManager.clickCreatingTool.archetypeNodeData = {
        name: "Unit",
        leftArray: [],
        rightArray: [],
        topArray: [],
        bottomArray: []
    };

    myDiagram.contextMenu =
        $("ContextMenu",
            makeButton("Paste",
                function (e, obj) { e.diagram.commandHandler.pasteSelection(e.diagram.toolManager.contextMenuTool.mouseDownPoint); },
                function (o) { return o.diagram.commandHandler.canPasteSelection(o.diagram.toolManager.contextMenuTool.mouseDownPoint); }),
            makeButton("Undo",
                function (e, obj) { e.diagram.commandHandler.undo(); },
                function (o) { return o.diagram.commandHandler.canUndo(); }),
            makeButton("Redo",
                function (e, obj) { e.diagram.commandHandler.redo(); },
                function (o) { return o.diagram.commandHandler.canRedo(); })
        );

    myDiagram.addRow = function (x, y, name) {
        myDiagram.add(
            $(go.Part,
                {
                    movable: false,
                    selectable: false,
                    location: new go.Point(x, y)
                },
                $(go.Shape, "RoundedRectangle",  // the rectangular shape around the members
                    {
                        fill: "transparent", stroke: "gray", strokeWidth: 3,
                        minSize: new go.Size(720, 200),
                        cursor: "pointer",
                    }),
                $(go.TextBlock,
                    { margin: 5, text: name }
                )
            )
        );
    }
    // load the diagram from JSON data
    load();
}


// Add a port to the specified side of the selected nodes.
function addPort(side) {
    myDiagram.startTransaction("addPort");
    myDiagram.selection.each(function (node) {
        // skip any selected Links
        if (!(node instanceof go.Node)) return;
        // compute the next available index number for the side
        var i = 0;
        while (node.findPort(side + i.toString()) !== node) i++;
        // now this new port name is unique within the whole Node because of the side prefix
        var name = side + i.toString();
        // get the Array of port data to be modified
        var arr = node.data[side + "Array"];
        if (arr) {
            // create a new port data object
            var newportdata = {
                portId: name,
                portColor: getPortColor()
                // if you add port data properties here, you should copy them in copyPortData above
            };
            // and add it to the Array of port data
            myDiagram.model.insertArrayItem(arr, -1, newportdata);
        }
    });
    myDiagram.commitTransaction("addPort");
}

// Exchange the position/order of the given port with the next one.
// If it's the last one, swap with the previous one.
function swapOrder(port) {
    var arr = port.panel.itemArray;
    if (arr.length >= 2) {  // only if there are at least two ports!
        for (var i = 0; i < arr.length; i++) {
            if (arr[i].portId === port.portId) {
                myDiagram.startTransaction("swap ports");
                if (i >= arr.length - 1) i--;  // now can swap I and I+1, even if it's the last port
                var newarr = arr.slice(0);  // copy Array
                newarr[i] = arr[i + 1];  // swap items
                newarr[i + 1] = arr[i];
                // remember the new Array in the model
                myDiagram.model.setDataProperty(port.part.data, port._side + "Array", newarr);
                myDiagram.commitTransaction("swap ports");
                break;
            }
        }
    }
}

// Remove the clicked port from the node.
// Links to the port will be redrawn to the node's shape.
function removePort(port) {
    myDiagram.startTransaction("removePort");
    var pid = port.portId;
    var arr = port.panel.itemArray;
    for (var i = 0; i < arr.length; i++) {
        if (arr[i].portId === pid) {
            myDiagram.model.removeArrayItem(arr, i);
            break;
        }
    }
    myDiagram.commitTransaction("removePort");
}

// Remove all ports from the same side of the node as the clicked port.
function removeAll(port) {
    myDiagram.startTransaction("removePorts");
    var nodedata = port.part.data;
    var side = port._side;  // there are four property names, all ending in "Array"
    myDiagram.model.setDataProperty(nodedata, side + "Array", []);  // an empty Array
    myDiagram.commitTransaction("removePorts");
}

// Change the color of the clicked port.
function changeColor(port) {
    myDiagram.startTransaction("colorPort");
    var data = port.data;
    myDiagram.model.setDataProperty(data, "portColor", getPortColor());
    myDiagram.commitTransaction("colorPort");
}

// Use some pastel colors for ports
function getPortColor() {
    var portColors = ["#fae3d7", "#d6effc", "#ebe3fc", "#eaeef8", "#fadfe5", "#6cafdb", "#66d6d1"]
    return portColors[Math.floor(Math.random() * portColors.length)];
}

function load() {
    var count = prompt("How many rows do you want to add ?", "3");
    if (!count || isNaN(count)) {
        return;
    }
    count = parseInt(count);

    for (var i = 0; i < count; i++) {
        myDiagram.addRow(0, i * 200, "Group-" + (i + 1));
    }
    myDiagram.model = new go.GraphLinksModel([], []);
    myDiagram.model.copiesArrays = true;
    myDiagram.model.copiesArrayObjects = true;
    myDiagram.model.linkFromPortIdProperty = "fromPort";
    myDiagram.model.linkToPortIdProperty = "toPort";

    // var rows = 3;
    // myDiagram.startTransaction("add new group");
    // for (i = 0; i < rows; i++) {
    //     myDiagram.model.addNodeData({ key: i + 1, name: '', loc: '0 ' + (i * 200), isGroup: true });
    // }
    // myDiagram.commitTransaction("add new group");

    // When copying a node, we need to copy the data that the node is bound to.
    // This JavaScript object includes properties for the node as a whole, and
    // four properties that are Arrays holding data for each port.
    // Those arrays and port data objects need to be copied too.
    // Thus Model.copiesArrays and Model.copiesArrayObjects both need to be true.

    // Link data includes the names of the to- and from- ports;
    // so the GraphLinksModel needs to set these property names:
    // linkFromPortIdProperty and linkToPortIdProperty.
}

function addNode() {
    var count = prompt("How many nodes do you want to add ?", "1");
    if (!count || isNaN(count)) {
        return;
    }
    count = parseInt(count);
    var categoryNumber = Number(document.getElementById("select-box").value);
    var nodes = JSON.parse(myDiagram.model.toJson());
    // console.log(myDiagram.findNodeForKey(categoryNumber))
    var category = nodeDataArray.find(it => it.key == categoryNumber);
    var existing = nodes.nodeDataArray.filter(it => it.categoryId == category.key).length;

    myDiagram.startTransaction("add new node");
    for (var i = 0; i < count; i++) {
        var newKey = existing + i + 1;
        myDiagram.model.addNodeData({
            "key": Number(category.key + '' + newKey),
            "name": category.name + '_' + newKey,
            "loc": (20 * i + 100) + ' ' + (20 * i + 100),
            "categoryId": category.key,
            "leftArray": category.leftArray,
            "topArray": category.topArray,
            "bottomArray": category.bottomArray,
            "rightArray": category.rightArray,
            "group": 1
        });
    }
    myDiagram.commitTransaction("add new node");
}

var nodeDataArray = [
    {
        "key": 1, "name": "Unit One", "loc": "101 204",
        "leftArray": [{ "portColor": "#fae3d7", "portId": "left0" }],
        "topArray": [{ "portColor": "#d6effc", "portId": "top0" }],
        "bottomArray": [{ "portColor": "#ebe3fc", "portId": "bottom0" }],
        "rightArray": [{ "portColor": "#eaeef8", "portId": "right0" }, { "portColor": "#fadfe5", "portId": "right1" }]
    },
    {
        "key": 2, "name": "Unit Two", "loc": "320 152",
        "leftArray": [{ "portColor": "#6cafdb", "portId": "left0" }, { "portColor": "#66d6d1", "portId": "left1" }, { "portColor": "#fae3d7", "portId": "left2" }],
        "topArray": [{ "portColor": "#d6effc", "portId": "top0" }],
        "bottomArray": [{ "portColor": "#eaeef8", "portId": "bottom0" }, { "portColor": "#eaeef8", "portId": "bottom1" }, { "portColor": "#6cafdb", "portId": "bottom2" }],
        "rightArray": []
    },
    {
        "key": 3, "name": "Unit Three", "loc": "384 319",
        "leftArray": [{ "portColor": "#66d6d1", "portId": "left0" }, { "portColor": "#fadfe5", "portId": "left1" }, { "portColor": "#6cafdb", "portId": "left2" }],
        "topArray": [{ "portColor": "#66d6d1", "portId": "top0" }],
        "bottomArray": [{ "portColor": "#6cafdb", "portId": "bottom0" }],
        "rightArray": []
    },
    {
        "key": 4, "name": "Unit Four", "loc": "138 351",
        "leftArray": [{ "portColor": "#fae3d7", "portId": "left0" }],
        "topArray": [{ "portColor": "#6cafdb", "portId": "top0" }],
        "bottomArray": [{ "portColor": "#6cafdb", "portId": "bottom0" }],
        "rightArray": [{ "portColor": "#6cafdb", "portId": "right0" }, { "portColor": "#66d6d1", "portId": "right1" }]
    }
]