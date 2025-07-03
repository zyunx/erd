
/*
 * ERD view
 */

function erdv_init(erd) {
    
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
        on_props_changed: function(props) {},
        on_relationship_set_add_role(entity_set_name, role_name, role_multiplicity) {},
        on_relationship_set_remove_role(relationship_set, role) { console.log("on_relationship_set_remove_role stub"); },
        async on_save() { console.log('on_save'); },

        on_settings_change: function(settings) { console.log('on_settings_change ', settings); },

        /* methods */
        draw_entity_set,
        draw_relationship_set,
        clear,
        change_canvas_size,
        show_entity_set_properties,
        show_relationship_set_properties,
        hide_props,
        show_erd_props,
        get_save_file_handle,
    };

    function clear()
    {
        erd_canvas_ctx.clearRect(0, 0, erd_canvas.width, erd_canvas.height);
    }

    function change_canvas_size(size){
        erd_canvas.width = size['width']
        erd_canvas.height = size['height']
        erd_canvas_ctx = erd_canvas.getContext("2d");
        erd_canvas_ctx.font = "16px serif";
    }

    function draw_entity_set(e)
    {
        console.log('erdv: draw_entity');
        const x1 = e['x'] - e['width']/2;
        const y1 = e['y'] - e['height']/2;
        erd_canvas_ctx.strokeRect(x1, y1, e['width'], e['height']);
        const e_name = e['name'];
        const text_g = erd_canvas_ctx.measureText(e_name);
        const font_x = e['x'] - text_g.width/2;
        const font_y = e['y'] + _text_height(text_g)/2;
        erd_canvas_ctx.fillText(e_name, font_x, font_y);
    }

    function _text_height(text_measure)
    {
        return text_measure['actualBoundingBoxAscent'] - text_measure['actualBoundingBoxDescent'];
    }

    function draw_relationship_set(r)
    {
        //console.log('erdv: draw_relationship', r);

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
        const font_y = r['y'] + _text_height(text_g)/2;
        erd_canvas_ctx.fillText(r_name, font_x, font_y);

        for (const role of r['roles'])
        {
            const x1 = role['relationship_set_endpoint']['x'];
            const y1 = role['relationship_set_endpoint']['y'];
            const x2 = role['entity_set_endpoint']['x'];
            const y2 = role['entity_set_endpoint']['y'];

            erd_canvas_ctx.beginPath();
            erd_canvas_ctx.moveTo(x1, y1);
            erd_canvas_ctx.lineTo(x2, y2);
            erd_canvas_ctx.stroke();

            _draw_role_name_label(role);
            _draw_role_multiplicity_label(role);
        }
    }

    function _draw_role_name_label(role)
    {
        const role_name = role['role_name'];
        if (role_name)
        {
            const text_g = erd_canvas_ctx.measureText(role_name);
            const padding = 10;
            const label_pos = _role_name_label_left_bottom(role, 
                text_g.width + padding, _text_height(text_g) + padding);

            //console.log('_draw_role_name_label', label_pos);
            erd_canvas_ctx.fillText(role_name, 
                label_pos['x'] + padding/2, label_pos['y'] - padding/2);
        }
    }

    function _draw_role_multiplicity_label(role)
    {
        const role_multiplicity = role['role_multiplicity'];
        if (role_multiplicity)
        {
            const text_g = erd_canvas_ctx.measureText(role_multiplicity);
            const padding = 10;
            const label_pos = _role_multiplicity_label_left_bottom(role, 
                text_g.width + padding, _text_height(text_g) + padding);

            erd_canvas_ctx.fillText(role_multiplicity, 
                label_pos['x'] + padding/2, label_pos['y'] - padding/2);
        }
    }

    function _role_label_offset(role, label_width, label_height)
    {
        /*
        * see internal/HowToPositionRoleNameLabel
        */
        const xr = role['entity_set_endpoint']['x'] - role['relationship_set_endpoint']['x'];
        const yr = role['entity_set_endpoint']['y'] - role['relationship_set_endpoint']['y'];

        let x2;
        let y2;

        if (xr == 0)
        {
            if (yr >= 0)
            {
                x2 = label_width/2;
                y2 = 0;
            }
            else
            {
                x2 = -label_width/2;
                y2 = 0;
            }
            
            return {
                x: x2,
                y: y2,
            };
        }
        else if (xr >= 0)
        {
            let k =  yr/(1.0 * xr);

            if (yr < 0)
            {
                x1 = (label_width + k * label_height) / (2 * (k*k + 1));
                y1 = k * x1;
    
                x2 = x1 - label_width/2;
                y2 = y1 - label_height/2;
    
                return {
                    x: x2,
                    y: y2,
                };
            }
            else 
            {
                x1 = (-label_width + k * label_height) / (2 * (k*k + 1));
                y1 = k * x1;
    
                x2 = x1 + label_width/2;
                y2 = y1 - label_height/2;
    
                return {
                    x: x2,
                    y: y2,
                };
            }
        }
        else
        {
            let k =  yr/(1.0 * xr);

            if (yr < 0)
            {
                x1 = (label_width - k * label_height) / (2 * (k*k + 1));
                y1 = k * x1;
    
                x2 = x1 - label_width/2;
                y2 = y1 + label_height/2;
    
                return {
                    x: x2,
                    y: y2,
                };
            }
            else 
            {
                x1 = (-label_width - k * label_height) / (2 * (k*k + 1));
                y1 = k * x1;
    
                x2 = x1 + label_width/2;
                y2 = y1 + label_height/2;
    
                return {
                    x: x2,
                    y: y2,
                };
            }
        }
    }

    function _role_name_label_left_bottom(role, text_width, text_height)
    {
        const lb = {
            x: (role['entity_set_endpoint']['x'] + role['relationship_set_endpoint']['x'])/2 - text_width/2,
            y: (role['entity_set_endpoint']['y'] + role['relationship_set_endpoint']['y'])/2 + text_height/2,
        };

        const center = _role_label_offset(role, text_width, text_height);

        return {
            x: lb['x'] + center['x'],
            y: lb['y'] + center['y'],
        };
    }

    function _role_multiplicity_label_left_bottom(role, text_width, text_height)
    {
        const lb = {
            x: (role['entity_set_endpoint']['x'] + role['relationship_set_endpoint']['x'])/2 - text_width/2,
            y: (role['entity_set_endpoint']['y'] + role['relationship_set_endpoint']['y'])/2 + text_height/2,
        };

        const center = _role_label_offset(role, text_width, text_height);

        /* role multiplicity label is symmetric to role name label
         * about axis of role connection line. */ 
        return {
            x: lb['x'] - center['x'],
            y: lb['y'] - center['y'],
        };
    }

    function _show_props(property_box)
    {
        const propertybox_container = document.getElementById('propertybox-container');
        while (propertybox_container.firstChild) {
            propertybox_container.removeChild(propertybox_container.firstChild);
        }
        propertybox_container.appendChild(property_box);
        propertybox_container.style.visibility = 'visible';
    }

    function show_entity_set_properties(e)
    {
        _show_props(create_entity_set_propertybox(e));
    }

    function show_relationship_set_properties(relationship_set, entity_sets)
    {
        _show_props(_create_relationship_set_propertybox(relationship_set, entity_sets));
    }

    function show_erd_props(erd)
    {
        _show_props(_create_erd_propertybox(erd));
    }

    function _create_erd_propertybox(erd)
    {
        const box = document.createElement('div');

        const props_tab = document.createElement('table');

        props_tab.appendChild(_html('<tr><th colspan="2">Entity Set<th></tr>'));
        const entity_set_width_input = document.createElement('input');
        entity_set_width_input.value = erd['entity_set.width'];
        props_tab.appendChild(_tr(
            _td(_text('Width: ')),
            _td(entity_set_width_input)
        ));

        const entity_set_height_input = document.createElement('input');
        entity_set_height_input.value = erd['entity_set.height'];
        props_tab.appendChild(_tr(
            _td(_text('Height: ')),
            _td(entity_set_height_input)
        ));

        props_tab.appendChild(_html('<tr><th colspan="2">Relationship Set<th></tr>'));
        const relationship_set_width_input = document.createElement('input');
        relationship_set_width_input.value = erd['relationship_set.width'];
        props_tab.appendChild(_tr(
            _td(_text('Width: ')),
            _td(relationship_set_width_input)
        ));

        const relationship_set_height_input = document.createElement('input');
        relationship_set_height_input.value = erd['relationship_set.height'];
        props_tab.appendChild(_tr(
            _td(_text('Height: ')),
            _td(relationship_set_height_input)
        ));

        props_tab.appendChild(_html('<tr><th colspan="2">Canvas<th></tr>'));
        const canvas_width_input = document.createElement('input');
        canvas_width_input.value = erd['width'];
        props_tab.appendChild(_tr(
            _td(_text('Width: ')),
            _td(canvas_width_input)
        ));

        const canvas_height_input = document.createElement('input');
        canvas_height_input.value = erd['height'];
        props_tab.appendChild(_tr(
            _td(_text('Height: ')),
            _td(canvas_height_input)
        ));


        const button_change_settings = document.createElement('button');
        button_change_settings.innerText = 'Change';
        button_change_settings.addEventListener('click', evt => {
            erdv['on_settings_change']({
                "width": canvas_width_input.value,
                "height": canvas_height_input.value,
                'entity_set.width' : entity_set_width_input.value,
                'entity_set.height': entity_set_height_input.value,
                'relationship_set.width': relationship_set_width_input.value,
                'relationship_set.height': relationship_set_height_input.value,
            });
        });

        box.appendChild(props_tab);
        box.appendChild(button_change_settings);
        return box;
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

    function _create_relationship_set_propertybox(relationship_set, entity_sets)
    {
        const box = document.createElement('div');

        const props_tab = document.createElement('table');
        const props_tr = document.createElement('tr');
        const props_name = document.createElement('th');
        props_name.innerText = 'Name';
        const props_value = document.createElement('td');
        const props_name_input = document.createElement('input');
        props_name_input.value = relationship_set['name'];
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

        // Roles table
        const roles = _html('<div>\
                <div>Roles</div>\
            </div>');

        const roles_table = _html('<table>\
                <tr>\
                    <th>Entity</th>\
                    <th>Role</th>\
                    <th>Mutiplicity</th>\
                    <th>Action</th>\
                </tr>\
            </table>');
        for (const r of relationship_set['roles'])
        {
            const remove_role_button = document.createElement('button', {
                'type': 'button'
            });
            remove_role_button.innerText = '-';
            remove_role_button.addEventListener('click', e => {
                erdv['on_relationship_set_remove_role'](relationship_set, r);
            });

            roles_table.appendChild(
                _tr(
                    _td(_text(r['entity_set_name'])),
                    _td(_text(r['role_name'])),
                    _td(_text(r['role_multiplicity'])),
                    _td(remove_role_button)
                )
            );
        }

        const role_entity_set = document.createElement('select');
        for (const e of entity_sets)
        {
            const name = e['name'];
            role_entity_set.appendChild(
                _html(`<option value="${name}">${name}</option>`)
            );
        }
        const role_name = document.createElement('input', {
            'type': 'text'
        });
        role_name.style.width = '8em';
        const role_multiplicity = document.createElement('input', {
            'type': 'text'
        });
        role_multiplicity.style.width = '2em';
        const role_button = document.createElement('button', {
            'type': 'button'
        });
        role_button.innerText = '+';
        role_button.addEventListener('click', e => {
            erdv['on_relationship_set_add_role'](
                role_entity_set.value, role_name.value, role_multiplicity.value);
        });
        roles_table.appendChild(
            _tr(
                _td(role_entity_set),
                _td(role_name),
                _td(role_multiplicity),
                _td(role_button)
            )
        );
        roles.appendChild(roles_table);
        box.appendChild(roles);

        return box;
    }

    function _tr(...children)
    {
        const tr = document.createElement('tr');
        for (const c of children)
        {
            tr.appendChild(c);
        }
        return tr;
    }

    function _td(child)
    {
        const td = document.createElement('td');
        td.appendChild(child);
        return td;
    }

    function _html(htm)
    {
        const t = document.createElement('template');
        t.innerHTML = htm;
        return t.content.firstChild;
    }

    function _text(t)
    {
        return document.createTextNode(t);
    }

    function hide_props()
    {
        const propertybox_container = document.getElementById('propertybox-container');
        propertybox_container.style.visibility = 'hidden';
    }

    async function get_save_file_handle()
    {
        // Supported by Chrome and Edge for now on 20250508.
        return await window.showSaveFilePicker();
    }

    window.addEventListener('beforeunload', e => {
        if (!confirm("Are sure to leave this document?"))
        {
            e.preventDefault();
        }
    });

    var erd_save_button = document.getElementById('save-button');
    erd_save_button.addEventListener('click', async e => {
        await erdv['on_save']();
    });

    var erd_load_button = document.getElementById('load-button');
    erd_load_button.addEventListener('click', async e => {
        // Supported by Chrome and Edge for now on 20250508.
        const [file_handle] = await window.showOpenFilePicker();
        await erdv['on_load'](file_handle);
    });
    
    var erd_canvas_container = document.getElementById('erd-canvas-container')
    const erd_canvas = document.getElementById('erd-canvas');
    erd_canvas.width = erd['width']
    erd_canvas.height = erd['height']
    var erd_canvas_ctx = erd_canvas.getContext("2d");
    erd_canvas_ctx.font = "16px serif";
    

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