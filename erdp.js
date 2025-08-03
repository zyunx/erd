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
    const TARGET_RECTANGLE_SELECTION = 'TARGET_RECTANGLE_SELECTION';

    var selection_rectangle = null;
    var offset_from_mouse_of_selectioin_rectangle = null;
        
    var objects_selected = []
    var offsets_from_mouse_of_objects_selected = []

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
            current_mouse_target = TARGET_RECTANGLE_SELECTION;
            offset_from_mouse_of_selectioin_rectangle = [
                selection_rectangle[0] - x,
                selection_rectangle[1] - y
            ];
            offsets_from_mouse_of_objects_selected = objects_selected.map(
                obj => [obj['x'] - x, obj['y'] - y]
            );
            // console.log('offsets_from_mouse_of_objects_selected:', offsets_from_mouse_of_objects_selected)
        }
        else
        {
            selection_rectangle = null;
            objects_selected = []

            const obj = get_object_by_coordinate(erd, x, y)
            if (obj != null)
            {
                current_mouse_target = TARGET_SINGLE_OBJECT;

                select_object(obj, [
                    obj['x'] - x,
                    obj['y'] - y
                ]);
            }
            else if (to_draw != null) {
                current_mouse_target = TARGET_SINGLE_OBJECT;
                if (to_draw == TO_DRAW_ENTITY_SET) {
                    draw_entity_set(x, y);            
                } else if (to_draw == TO_DRAW_RELATIONSHIP_SET) {
                    draw_relationship_set(x, y);
                }    
            }
            else
            {
                current_mouse_target = TARGET_CANVAS;
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

        if (current_mouse_target == TARGET_RECTANGLE_SELECTION)
        {
            // move selection rectangle
            selection_rectangle = [
                x + offset_from_mouse_of_selectioin_rectangle[0],
                y + offset_from_mouse_of_selectioin_rectangle[1],
                selection_rectangle[2],
                selection_rectangle[3]
            ];

            // move objects
            _move_objects(objects_selected, x, y);
        }
        else if (current_mouse_target == TARGET_SINGLE_OBJECT)
        {
            _move_objects(objects_selected, x, y);
        }
        else
        {
            /* rectangle selection (x, y, x_offset, y_offset)*/
            selection_rectangle = [canvas_mouse_down_coordinate[0],
                                    canvas_mouse_down_coordinate[1],
                                    x - canvas_mouse_down_coordinate[0],
                                    y - canvas_mouse_down_coordinate[1]
                                ];
            objects_selected = _compute_objects_in_rectangle(selection_rectangle);
        }

        update_canvas();
    };

    function _move_objects(objects, mouse_x, mouse_y)
    {
        // move objects
        for (let i = 0; i < objects.length; i++)
        {
            const obj = objects[i];
            const offset = offsets_from_mouse_of_objects_selected[i];
            const tx = mouse_x + offset[0];
            const ty = mouse_y + offset[1];
            if (obj['type'] == 'relationship_set')
            {
                erd_move_relationship_set(erd, obj, tx, ty)
            }
            else if (obj['type'] == 'entity_set')
            {
                erd_move_entity_set(erd, obj, tx, ty)
            }
        }
    }

    erdv['on_canvas_mouse_up'] = function(x, y)
    {
        console.log("erdp: on_canvas_mouse_up");
        canvas_mouse_down = false;

        update();
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
        if (objects_selected.length == 1)
        {
            objects_selected[0]['name'] = props['name'];
            update_canvas();
        }
    }

    erdv['on_props_remove_button_click'] = function()
    {
        if (objects_selected.length == 1)
        {
            if (objects_selected[0]['type'] == 'entity_set')
            {
                erd_remove_entity_set(erd, objects_selected[0]);
            }
            else if (objects_selected[0]['type'] == 'relationship_set')
            {
                erd_remove_relationship_set(erd, objects_selected[0]);
            }

            objects_selected = []

            update();
        }
    }

    erdv['on_relationship_set_add_role'] = function(entity_set_id, role_name, role_multiplicity)
    {
        console.log('on_relationship_set_add_role', entity_set_id, role_name, role_multiplicity);
        const relationship_set = erd_get_relationship_set_by_id(erd, objects_selected[0]['id']);
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

        objects_selected = [];
        selection_rectangle = null;select_object

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

        select_object(e, [0, 0]);
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

        select_object(r, [0, 0]);
    }

    function select_object(obj, offset)
    {
        objects_selected = [obj];
        offsets_from_mouse_of_objects_selected = [offset];
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
        console.log('hide_props')

        erdv['hide_props']();
    }

    function show_erd_props()
    {
        console.log('show_erd_props')
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

        objects_selected.forEach(obj => show_object_selection(obj));

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
        console.log('objects_selected: ', objects_selected);

        if (objects_selected.length == 0)
        {
            show_erd_props();
        }
        else if (objects_selected.length == 1)
        {
            show_object_props(objects_selected[0]);
        }
        else
        {
            hide_props();
        }
    }

    function is_in_selection_rectangle(x, y)
    {
        if (selection_rectangle == null)
        {
            return false;
        }

        return _is_point_in_rectangle(x, y, selection_rectangle);
    }

    function _is_point_in_rectangle(x, y, rect)
    {
        // normalize rectangele, ie. offset must be positive
        const r = [
            rect[0],
            rect[1],
            rect[2],
            rect[3]
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

    function _is_all_points_in_rect(points, rect)
    {
        return points.every(p => _is_point_in_rectangle(p[0], p[1], rect));
    }

    function _compute_objects_in_rectangle(rect)
    {
        const results = [];
        for (let i = 0; i < erd["entity_sets"].length; i++) {
            const e = erd["entity_sets"][i];
            const center_x = e['x'];
            const center_y = e['y'];
            const half_width = e['width'] / 2;
            const half_height = e['height'] / 2;

            const entity_sets_endpoints = [
                [center_x - half_width, center_y - half_height],
                [center_x + half_width, center_y - half_height],
                [center_x + half_width, center_y + half_height],
                [center_x - half_width, center_y + half_height],
            ]
            if (_is_all_points_in_rect(entity_sets_endpoints, rect))
            {
                results.push(e);
            }
        }

        for (let i = 0; i < erd["relationship_sets"].length; i++) {
            const r = erd["relationship_sets"][i];
            const center_x = r['x'];
            const center_y = r['y'];
            const half_width = r['width'] / 2;
            const half_height = r['height'] / 2;

            const relationsip_sets_endpoints = [
                [center_x - half_width, center_y],
                [center_x, center_y - half_height],
                [center_x + half_width, center_y],
                [center_x, center_y + half_height],
            ]
            if (_is_all_points_in_rect(relationsip_sets_endpoints, rect))
            {
                results.push(r);
            }
        }
        return results;
    }
}