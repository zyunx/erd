
/*
 * ERD view
 */

function erdv_init() {
    
    const erdv = {
        /* events */
        /* for toolbar */
        on_entity_set_to_be_drawed: function() {},
        on_relationship_set_to_be_drawed: function() {},
        /* for canvas */
        // event order: mouse_down, mouse_move(optional), move_up, click
        on_canvas_click: function(x, y) {},
        on_canvas_mouse_down: function (x, y) {},
        on_canvas_mouse_move: function (x, y) {},
        on_canvas_mouse_up: function (x, y) {},
        /* for property box */
        'on_props_changed': function(props) {},

        /* methods */
        draw_entity_set,
        draw_relationship_set,
        clear,
        show_props,
        hide_props,
    };

    function clear()
    {
        erd_canvas_ctx.clearRect(0, 0, erd_canvas.width, erd_canvas.height);
    }

    function draw_entity_set(e)
    {
        console.log('erdv: draw_entity');
        erd_canvas_ctx.strokeRect(e['x'], e['y'], e['width'], e['height']);
        const e_name = e['name'];
        const text_g = erd_canvas_ctx.measureText(e_name);
        const font_x = (e['width'] - text_g.width)/2 + e['x'];
        const font_y = 30  + e['y'];
        console.log(e['x'], e['y'], font_x, font_y);
        erd_canvas_ctx.fillText(e_name, font_x, font_y);
    }

    function draw_relationship_set(r)
    {
        console.log('erdv: draw_relationship', r);

        const p1 = {
            x: r['x'] - r['width']/2,
            y: r['y'],
        };
        const p2 = {
            x: r['x'],
            y: r['y'] + r['height']/2,
        };
        const p3 = {
            x: r['x'] + r['width']/2,
            y: r['y'],
        };
        const p4 = {
            x: r['x'],
            y: r['y'] - r['height']/2,
        };

        // draw shape
        erd_canvas_ctx.beginPath();
        erd_canvas_ctx.moveTo(p1['x'], p1['y']);
        erd_canvas_ctx.lineTo(p2['x'], p2['y']);
        erd_canvas_ctx.lineTo(p3['x'], p3['y']);
        erd_canvas_ctx.lineTo(p4['x'], p4['y']);
        erd_canvas_ctx.closePath();
        erd_canvas_ctx.stroke();

        // draw name text
        const r_name = r['name'];
        const text_g = erd_canvas_ctx.measureText(r_name);
        const font_x = r['x'] - text_g.width/2;
        const font_y = r['y'] + 6;
        erd_canvas_ctx.fillText(r_name, font_x, font_y);
    }

    function show_props(e)
    {
        const propertybox_container = document.getElementById('propertybox-container');
        while (propertybox_container.firstChild) {
            propertybox_container.removeChild(propertybox_container.firstChild);
        }
        if (e['type'] == 'entity_set')
        {
            propertybox_container.appendChild(create_entity_set_propertybox(e));
        } else if (e['type'] == 'relationship_set')
        {
            propertybox_container.appendChild(create_relationship_set_propertybox(e));
        }
        propertybox_container.style.visibility = 'visible';
    }

    function create_entity_set_propertybox(e)
    {
        const box = document.createElement('div');

        const props_tab = document.createElement('table');
        const props_tr = document.createElement('tr');
        const props_name = document.createElement('th');
        props_name.innerText = 'Name';
        const props_value = document.createElement('td');
        const props_name_input = document.createElement('input');
        props_name_input.value = e['name'];
        props_name_input.addEventListener('input', ev => {
            erdv['on_props_changed']({
                name: props_name_input.value
            });
        });
        props_value.appendChild(props_name_input);
        props_tr.appendChild(props_name);
        props_tr.appendChild(props_value);
        props_tab.appendChild(props_tr);
        box.appendChild(props_tab);
        return box;
    }

    function create_relationship_set_propertybox(e)
    {
        const box = document.createElement('div');

        const props_tab = document.createElement('table');
        const props_tr = document.createElement('tr');
        const props_name = document.createElement('th');
        props_name.innerText = 'Name';
        const props_value = document.createElement('td');
        const props_name_input = document.createElement('input');
        props_name_input.value = e['name'];
        props_name_input.addEventListener('input', ev => {
            erdv['on_props_changed']({
                name: props_name_input.value
            });
        });
        props_value.appendChild(props_name_input);
        props_tr.appendChild(props_name);
        props_tr.appendChild(props_value);
        props_tab.appendChild(props_tr);
        box.appendChild(props_tab);
        return box;
    }

    function hide_props()
    {
        const propertybox_container = document.getElementById('propertybox-container');
        propertybox_container.style.visibility = 'hidden';
    }

    
    var erd_canvas = document.getElementById('erd-canvas');
    erd_canvas.width = 800;
    erd_canvas.height = 800;
    const erd_canvas_ctx = erd_canvas.getContext("2d");
    erd_canvas_ctx.font = "20px serif";
    

    erd_canvas.addEventListener("click", ev => {
        erdv['on_canvas_click'](ev.offsetX, ev.offsetY);
    });

    erd_canvas.addEventListener('mousedown', ev => {
        erdv['on_canvas_mouse_down'](ev.offsetX, ev.offsetY);
    });

    erd_canvas.addEventListener('mousemove', ev => {
        erdv['on_canvas_mouse_move'](ev.offsetX, ev.offsetY);
    });

    erd_canvas.addEventListener('mouseup', ev => {
        erdv['on_canvas_mouse_up'](ev.offsetX, ev.offsetY);
    });

    /*
     * Toolbar
     */
    const entity_button = document.getElementById("entity-button")
    entity_button.addEventListener("click", ev => {
        erdv['on_entity_set_to_be_drawed']();
    });

    const relationship_button = document.getElementById("relationship-button")
    relationship_button.addEventListener("click", ev => {
        erdv['on_relationship_set_to_be_drawed']();
    });

    return erdv;
};