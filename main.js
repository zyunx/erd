console.log("Hello, ERD!");

(function () {
    
    var to_draw = null;
    const TO_DRAW_ENTITY = "ENTITY";
    var current_selected = null;
    
    var erd_canvas = document.getElementById('erd-canvas');
    erd_canvas.width = 800;
    erd_canvas.height = 800;
    const erd_canvas_ctx = erd_canvas.getContext("2d");
    erd_canvas_ctx.font = "20px serif";

    var erd_property_box_container = null;
    var erd_entity_property_box = null;
    function init_erd_property_boxes() {
        const erd_pb_entity_name = document.getElementById('erd-pb-entity-name');
        erd_pb_entity_name.addEventListener('input', ev => {
            if (current_selected && current_selected['type'] == 'entity') {
                const e = current_selected;
                e['name'] = erd_pb_entity_name.value;

                update();
            }
        });
    }
    function get_erd_entity_property_box() {

    }
    init_erd_property_boxes();
    


    erd_canvas.addEventListener("click", ev => {
        if (to_draw == null) {
            return false;
        }

        if (to_draw == TO_DRAW_ENTITY) {
            const e = erd_create_entity(ev.offsetX, ev.offsetY)

            erd_add_entity(erd, e);
            to_draw = null;
            current_selected = e
        }

        update();
    });

    const entity_button = document.getElementById("entity-button")
    entity_button.addEventListener("click", ev => {
        to_draw = TO_DRAW_ENTITY;
    });


    


    const erd = erd_create_erd();


    update = function ()
    {
        erd_canvas_ctx.clearRect(0, 0, erd_canvas.width, erd_canvas.height);

        for (let i = 0; i < erd["entities"].length; i++) {
            const e = erd["entities"][i];
            erd_canvas_ctx.strokeRect(e['x'], e['y'], e['width'], e['height']);
            const e_name = e['name']
            const text_g = erd_canvas_ctx.measureText(e_name);
            const font_x = (e['width'] - text_g.width)/2 + e['x'];
            const font_y = 25  + e['y'];
            console.log(e['x'], e['y'], font_x, font_y);
            erd_canvas_ctx.fillText(e_name, font_x, font_y);
        }

        if (current_selected) {
            if (current_selected['type'] == 'entity')
            {
                const propertybox_container = document.getElementById('propertybox-container');
                propertybox_container.querySelector("input[name=name]").value = current_selected['name']
            }
        }
    };

    update();



    
})();