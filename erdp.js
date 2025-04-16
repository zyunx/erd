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
    const TO_DRAW_RELATIONSHIP = "RELATIONSHIP";

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
            if (to_draw == TO_DRAW_ENTITY) {
                draw_entity(x, y);            
            } else if (to_draw == TO_DRAW_RELATIONSHIP) {
                draw_relationship(x, y);
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

    erdv['on_entity_to_be_drawed'] = function()
    {
        to_draw = TO_DRAW_ENTITY;
    }

    erdv['on_relationship_to_be_drawed'] = function()
    {
        to_draw = TO_DRAW_RELATIONSHIP;
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

        select_object(e, {
            x: -erd['entity.width']/2, 
            y: -erd['entity.height']/2,
        });
    };

    function draw_relationship(px, py)
    {
        const r = erd_create_relationship(erd, px, py);

        erdv['draw_relationship']({
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

        for (let i = 0; i < erd["relationships"].length; i++) {
            const r = erd["relationships"][i];
            erdv['draw_relationship'](r);
        }
    }

    

}