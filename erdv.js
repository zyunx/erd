
/*
 * ERD view
 */

function erdv_init() {
    
    const erdv = {
        /* events */
        'on_creating_entity': function(x, y) {},
        'on_props_changed': function(props) {},

        /* methods */
        draw_entity,
        clear,
        show_props,
        hide_props,
    };

    function clear()
    {
        erd_canvas_ctx.clearRect(0, 0, erd_canvas.width, erd_canvas.height);
    }

    function draw_entity(e)
    {
        console.log('erdv: draw_entity');
        erd_canvas_ctx.strokeRect(e['x'], e['y'], e['width'], e['height']);
        const e_name = e['name']
        const text_g = erd_canvas_ctx.measureText(e_name);
        const font_x = (e['width'] - text_g.width)/2 + e['x'];
        const font_y = 25  + e['y'];
        console.log(e['x'], e['y'], font_x, font_y);
        erd_canvas_ctx.fillText(e_name, font_x, font_y);
    }

    function show_props(e)
    {
        const propertybox_container = document.getElementById('propertybox-container');
        propertybox_container.querySelector("input[name=name]").value = e['name']
        propertybox_container.style.visibility = 'visible';
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

    function init_erd_property_boxes() {
        const erd_pb_entity_name = document.getElementById('erd-pb-entity-name');
        erd_pb_entity_name.addEventListener('input', ev => {
            erdv['on_props_changed']({
                name: erd_pb_entity_name.value
            });
        });

        hide_props();
    }

    init_erd_property_boxes();
    

    erd_canvas.addEventListener("click", ev => {
        erdv['on_canvas_click'](ev.offsetX, ev.offsetY);
    });

    const entity_button = document.getElementById("entity-button")
    entity_button.addEventListener("click", ev => {
        erdv['on_entity_to_be_drawed']();
    });

    return erdv;
};