/*
 * ERD presentor
 */

function erdp_create(erd, erdv)
{
    var object_selected = null;
    var to_draw = null;
    const TO_DRAW_ENTITY = "ENTITY";

    erdv['on_canvas_click'] = function(x, y)
    {
        if (to_draw == null) {
            const e = get_object_by_coordinate(erd, x, y)
            if (e)
            {
                select_entity(e);
            }
            else
            {
                erdv['hide_props']();
            }
            return;
        }

        if (to_draw == TO_DRAW_ENTITY) {
            draw_entity(x, y);            
            to_draw = null;
        }
    }

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

        object_selected = e;
        
        erdv['show_props']({
            name: e['name'],
        });
    };

    function select_entity(e)
    {
        object_selected = e;
        
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