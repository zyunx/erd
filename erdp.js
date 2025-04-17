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
    const TO_DRAW_ENTITY_SET = "ENTITY_SET";
    const TO_DRAW_RELATIONSHIP_SET = "RELATIONSHIP_SET";

    erdv['on_canvas_mouse_down'] = function(x, y)
    {
        console.log("erdp: on_canvas_mouse_down");
        canvas_mouse_down = true;

        if (to_draw == null) {
            const obj = get_object_by_coordinate(erd, x, y)
            if (obj == null)
            {
                object_selected = null;
                erdv['hide_props']();
            }
            else
            {
                select_object(obj, {
                    x: obj['x']-x, 
                    y: obj['y']-y
                });
            }
        }
        else
        {
            if (to_draw == TO_DRAW_ENTITY_SET) {
                draw_entity_set(x, y);            
            } else if (to_draw == TO_DRAW_RELATIONSHIP_SET) {
                draw_relationship_set(x, y);
            }
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

    erdv['on_entity_set_to_be_drawed'] = function()
    {
        to_draw = TO_DRAW_ENTITY_SET;
    }

    erdv['on_relationship_set_to_be_drawed'] = function()
    {
        to_draw = TO_DRAW_RELATIONSHIP_SET;
    }

    erdv['on_props_changed'] = function(props) 
    {
        if (object_selected)
        {
            object_selected['name'] = props['name'];
            update();
        }
    }

    function draw_entity_set(px, py)
    {
        const x = px - erd['entity_set.width']/2;
        const y = py - erd['entity_set.height']/2;
        const e = erd_create_entity_set(erd, x, y);

        erdv['draw_entity_set']({
            x,
            y,
            width: e['width'],
            height: e['height'],
            name: e['name']
        });

        select_object(e, {
            x: -erd['entity_set.width']/2, 
            y: -erd['entity_set.height']/2,
        });
    };

    function draw_relationship_set(px, py)
    {
        const r = erd_create_relationship_set(erd, px, py);

        erdv['draw_relationship_set']({
            x: r['x'],
            y: r['y'],
            width: r['width'],
            height: r['height'],
            name: r['name']
        });

        select_object(r, {
            x: 0, y: 0,
        });
    }

    function select_object(obj, shape_mouse_offset)
    {
        object_selected = obj;
        selected_shape_mouse_offset = shape_mouse_offset;

        erdv['show_props']({
            name: obj['name'],
        });
    }

    function update()
    {
        erdv['clear']();
        for (let i = 0; i < erd["entity_sets"].length; i++) {
            const e = erd["entity_sets"][i];
            erdv['draw_entity_set']({
                x: e['x'],
                y: e['y'],
                width: e['width'],
                height: e['height'],
                name: e['name'],
            })
        }

        for (let i = 0; i < erd["relationship_sets"].length; i++) {
            const r = erd["relationship_sets"][i];
            erdv['draw_relationship_set'](r);
        }
    }
}