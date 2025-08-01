/*
 * ERD presentor
 */

function erdp_create(erd, erdv)
{
    var canvas_mouse_down = false;
    var canvas_mouse_down_coordinate = null;
    var current_mouse_target = null;
    const TARGET_CANVAS = 'TARGET_CANVAS';
    const TARGET_SINGLE_OBJECT = 'TARGET_SINGLE_OBJECT';
    const TARGET_RECTANGEL_SELECTION = 'TARGET_RECTANGEL_SELECTION';
    var target_offset_from_mouse = null;

    var object_selected = null;
    var selection_rectangle = null;
    
    var to_draw = null;
    const TO_DRAW_ENTITY_SET = "ENTITY_SET";
    const TO_DRAW_RELATIONSHIP_SET = "RELATIONSHIP_SET";

    /* file handle for the underlying file of ERD */
    var file_handle = null;

    erdv['on_canvas_mouse_down'] = function(x, y)
    {
        /* If the cursor is in the selection rectangle:
         *     may be move multiple objects
         * else if the cursor is on an object:
         *     move the object
         * else if to draw object:
         *     draw object
         * else
         *     multiple selection or select canvas
         */
        console.log("erdp: on_canvas_mouse_down");
        canvas_mouse_down = true;
        canvas_mouse_down_coordinate = [x, y];

        if (is_in_selection_rectangle(x, y))
        {
            // selection_rectangle must not be null
            current_mouse_target = TARGET_RECTANGEL_SELECTION;
            target_offset_from_mouse = [
                selection_rectangle[0] - x,
                selection_rectangle[1] - y
            ];
            console.log('target_offset_from_mouse:', target_offset_from_mouse)
        }
        else
        {
            selection_rectangle = null;

            object_selected = null;

            const obj = get_object_by_coordinate(erd, x, y)
            if (obj != null)
            {
                current_mouse_target = TARGET_SINGLE_OBJECT;
                target_offset_from_mouse = [
                    obj['x'] - x,
                    obj['y'] - y
                ];
                select_object(obj);
            }
            else if (to_draw != null) {
                current_mouse_target = TARGET_SINGLE_OBJECT;
                target_offset_from_mouse = [0, 0];
                if (to_draw == TO_DRAW_ENTITY_SET) {
                    draw_entity_set(x, y);            
                } else if (to_draw == TO_DRAW_RELATIONSHIP_SET) {
                    draw_relationship_set(x, y);
                }    
            }
            else
            {
                current_mouse_target = TARGET_CANVAS;
                target_offset_from_mouse = [-x, -y];
            }
        }
        
        to_draw = null;
        
        update();
    };

    erdv['on_canvas_mouse_move'] = function(x, y)
    {
        /* If mouse down:
         *    if current mouse target is rectangle selection:
         *       move rectangle selection and objects intersected by the selection
         *    else if single object:
         *        drag object
         *    else:
         *        create a selection rectangle
         */
        if (!canvas_mouse_down)
            return;

        if (current_mouse_target == TARGET_RECTANGEL_SELECTION)
        {
            // move selection rectangle
            selection_rectangle = [
                x + target_offset_from_mouse[0],
                y + target_offset_from_mouse[1],
                selection_rectangle[2],
                selection_rectangle[3]
            ];
        }
        else if (current_mouse_target == TARGET_SINGLE_OBJECT)
        {
            const tx = x + target_offset_from_mouse[0];
            const ty = y + target_offset_from_mouse[1];

            if (object_selected['type'] == 'relationship_set')
            {
                erd_move_relationship_set(erd, object_selected, tx, ty)
            }
            else if (object_selected['type'] == 'entity_set')
            {
                erd_move_entity_set(erd, object_selected, tx, ty)
            }
        }
        else
        {
            /* rectangle selection (x, y, x_offset, y_offset)*/
            selection_rectangle = [canvas_mouse_down_coordinate[0],
                                    canvas_mouse_down_coordinate[1],
                                    x - canvas_mouse_down_coordinate[0],
                                    y - canvas_mouse_down_coordinate[1]
                                ];
            //console.log('selection_rectangle: ', selection_rectangle);
        }

        update();
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
            update_canvas();
        }
    }

    erdv['on_props_remove_button_click'] = function()
    {
        if (object_selected)
        {
            if (object_selected['type'] == 'entity_set')
            {
                erd_remove_entity_set(erd, object_selected);
            }
            else if (object_selected['type'] == 'relationship_set')
            {
                erd_remove_relationship_set(erd, object_selected);
            }

            object_selected = null

            update();
        }
    }

    erdv['on_relationship_set_add_role'] = function(entity_set_id, role_name, role_multiplicity)
    {
        console.log('on_relationship_set_add_role', entity_set_id, role_name, role_multiplicity);
        const relationship_set = erd_get_relationship_set_by_id(erd, object_selected['id']);
        const entity_set = erd_get_entity_set_by_id(erd, entity_set_id);
        
        erd_relationship_set_add_role(erd, relationship_set, entity_set, role_name, role_multiplicity);

        update();
    }

    erdv['on_relationship_set_remove_role'] = function(relationship_set_view, role_view)
    {
        const relationship_set = erd_get_relationship_set_by_id(erd, relationship_set_view['id']);
        const role = erd_get_relationship_set_role_by_id(erd, relationship_set, role_view['id']);

        erd_elationship_set_remove_role(erd, relationship_set, role);

        update();
    }

    erdv['on_save'] = async function () {
        if (file_handle == null)
        {
            file_handle = await erdv['get_save_file_handle']();
        }
        const writableStream = await file_handle.createWritable();
        await writableStream.write(JSON.stringify(erd));
        await writableStream.close();
    };
        
    erdv['on_load'] = async function (file) {
        file_handle = file;

        object_selected = null;

        erd = JSON.parse(await (await file_handle.getFile()).text());

        erd_layout_role_connection_lines(erd)

        console.log('onload: ', erd);

        erdv['change_canvas_size']({
            'width': erd['width'],
            'height': erd['height']
        });

        update();
    }

    erdv['on_settings_change'] = function (settings){
        erd_change_settings(erd, settings);

        erdv['change_canvas_size']({
            'width': erd['width'],
            'height': erd['height']
        });

        update();
    }

    function draw_entity_set(x, y)
    {
        const e = erd_create_entity_set(erd, x, y);

        erdv['draw_entity_set']({
            x,
            y,
            width: e['width'],
            height: e['height'],
            name: e['name'],
        });

        select_object(e);
    };

    function draw_relationship_set(px, py)
    {
        const r = erd_create_relationship_set(erd, px, py);

        erdv['draw_relationship_set']({
            x: r['x'],
            y: r['y'],
            width: r['width'],
            height: r['height'],
            name: r['name'],
            roles: r['roles'],
        });

        select_object(r);
    }

    function select_object(obj)
    {
        object_selected = obj;
    }

    function show_object_selection(obj)
    {
        console.log("show_object_selection: ", obj)
        if (obj['type'] == 'entity_set')
        {
            erdv['draw_entity_set_selection'](obj);
        }
        else if (obj['type'] == 'relationship_set')
        {
            erdv['draw_relationship_set_selection'](
                to_relationship_set_view(obj),
                erd['entity_sets']);
        }
    }

    function show_rectangle_selection(rect)
    {
        erdv['draw_rectangle_selection'](rect);
    }

    function show_object_props(obj)
    {
        if (obj['type'] == 'entity_set')
        {
            erdv['show_entity_set_properties'](obj);
        }
        else if (obj['type'] == 'relationship_set')
        {
            erdv['show_relationship_set_properties'](
                to_relationship_set_view(obj),
                erd['entity_sets']);
        }
    }


    /*
     * Decouple model and view
     */
    function to_relationship_set_role_view(role)
    {
        const entity_set = erd_get_entity_set_by_id(erd, role['entity_set_id']);
        return {
            ...role,
            entity_set_name: entity_set['name'],
        };
    }

    function to_relationship_set_view(relationship_set)
    {
        return {
            ...relationship_set,
            roles: relationship_set['roles'].map(role => to_relationship_set_role_view(role)),
        };
    }


    function hide_props()
    {
        erdv['hide_props']();
    }

    function show_erd_props()
    {
        erdv['show_erd_props'](erd);
    }

    function update_canvas()
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

        if (object_selected)
        {
            show_object_selection(object_selected);
        }

        if (selection_rectangle)
        {
            show_rectangle_selection(selection_rectangle);
        }
    }

    function update()
    {
        update_canvas();

        // show property box
        update_property_box();
    }

    function update_property_box()
    {
        if (object_selected)
        {
            show_object_props(object_selected);
        }
        else
        {
            hide_props();

            if (selection_rectangle == null)
            {
                show_erd_props();
            }
        }
    }

    function is_in_selection_rectangle(x, y)
    {
        if (selection_rectangle == null)
        {
            return false;
        }

        // normalize rectangele, ie. offset must be positive
        const r = [
            selection_rectangle[0],
            selection_rectangle[1],
            selection_rectangle[2],
            selection_rectangle[3]
        ];
        if (r[2] < 0)
        {
            r[0] = r[0] + r[2];
            r[2] = -r[2];
        }
        if (r[3] < 0)
        {
            r[1] = r[1] + r[3];
            r[3] = -r[3];
        }

        const x_offset = x - r[0];
        const y_offset = y - r[1];
        return (x_offset > 0 && x_offset < r[2] && y_offset > 0 && y_offset < r[3]);
    }
}