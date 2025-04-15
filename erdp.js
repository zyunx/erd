/*
 * ERD presentor
 */

function erdp_create(erd, erdv)
{
    var canvas_mouse_down = false;
    var object_selected = null;
    var selected_shape_mouse_offset = {
        x: 0,
        y: 0,
    };
    var to_draw = null;
    const TO_DRAW_ENTITY = "ENTITY";

    erdv['on_canvas_mouse_down'] = function(x, y)
    {
        console.log("erdp: on_canvas_mouse_down");
        canvas_mouse_down = true;

        if (to_draw == null) {
            const e = get_object_by_coordinate(erd, x, y)
            if (e)
            {
                select_entity(e, {
                    x: e['x']-x, 
                    y: e['y']-y
                });
            }
            else
            {
                object_selected = null;
                erdv['hide_props']();
            }
            return;
        }

        if (to_draw == TO_DRAW_ENTITY) {
            draw_entity(x, y);            
            to_draw = null;
        }
    };

    erdv['on_canvas_mouse_move'] = function(x, y)
    {
        if (canvas_mouse_down && object_selected)
        {
            object_selected['x'] = x + selected_shape_mouse_offset['x'];
            object_selected['y'] = y + selected_shape_mouse_offset['y'];

            update();
        }
    };

    erdv['on_canvas_mouse_up'] = function(x, y)
    {
        console.log("erdp: on_canvas_mouse_up");
        canvas_mouse_down = false;
    };

    erdv['on_entity_to_be_drawed'] = function()
    {
        to_draw = TO_DRAW_ENTITY;
    }

    erdv['on_props_changed'] = function(props) 
    {
        if (object_selected)
        {
            object_selected['name'] = props['name'];
            update();
        }
    }

    function draw_entity(px, py)
    {
        const x = px - erd['entity.width']/2;
        const y = py - erd['entity.height']/2;
        const e = erd_create_entity(erd, x, y);
        erd_add_entity(erd, e);

        erdv['draw_entity']({
            x,
            y,
            width: e['width'],
            height: e['height'],
            name: e['name']
        });

        select_entity(e, {
            x: -erd['entity.width']/2, 
            y: -erd['entity.height']/2,
        });
    };

    function select_entity(e, shape_mouse_offset)
    {
        object_selected = e;
        selected_shape_mouse_offset = shape_mouse_offset;

        erdv['show_props']({
            name: e['name'],
        });
    }

    function update()
    {
        erdv['clear']();
        for (let i = 0; i < erd["entities"].length; i++) {
            const e = erd["entities"][i];
            erdv['draw_entity']({
                x: e['x'],
                y: e['y'],
                width: e['width'],
                height: e['height'],
                name: e['name'],
            })
            
        }
    }

    

}