/*
 * ERD model
 */

const erd_settings_default = {
    "width": 1080,
    "height": 720,
    'entity_set.width' : 100,
    'entity_set.height': 50,
    'relationship_set.width': 140,
    'relationship_set.height': 70,
};

function erd_create()
{
    return {
        "width": erd_settings_default['width'],
        "height": erd_settings_default['height'],
        'entity_set.width' : erd_settings_default['entity_set.width'],
        'entity_set.height': erd_settings_default['entity_set.height'],
        'relationship_set.width': erd_settings_default['relationship_set.width'],
        'relationship_set.height': erd_settings_default['relationship_set.height'],
        "entity_sets": [],
        "relationship_sets": [],
    };
}

/*
 * To support saving and loading.
 * External storage can't store reference in memory.
 * So we need id or key to identify objects.
 */
function erd_generate_id()
{
    return crypto.randomUUID();
}

function erd_create_entity_set(erd, x = 0, y = 0)
{
    // (x, y) is the center of the rectangle
    const e = {
        id: erd_generate_id(),
        "x": x,
        "y": y,
        "width": erd['entity_set.width'],
        "height": erd['entity_set.height'],
        "name": "Entity",
        "type": "entity_set",
    };

    erd['entity_sets'].push(e);
    return e;
}

function erd_create_relationship_set(erd, x, y)
{
    // (x, y) is the center of the diamond
    const r = {
        id: erd_generate_id(),
        x,
        y,
        "width": erd['relationship_set.width'],
        "height": erd['relationship_set.height'],
        "name": "Relationship",
        "type": "relationship_set",
        'roles': [],
    };

    erd["relationship_sets"].push(r);

    return r;
}

function erd_move_relationship_set(erd, relationship_set, x, y)
{
    relationship_set['x'] = x;
    relationship_set['y'] = y;
    
    erd_layout_role_connection_lines(erd);
}

function erd_move_entity_set(erd, entity_set, x, y)
{
    entity_set['x'] = x;
    entity_set['y'] = y;

    erd_layout_role_connection_lines(erd);
}

function erd_layout_role_connection_lines(erd)
{
    /* trade off code readability with performance 
    /*
     * 1. update relationship set and entity set anchors
     *    for role connection lines
     * 2. separate coincided connection lines
     * 3. update coordinates of role connection line endpoints
     */
    _erd_update_all_role_anchors(erd);

    _erd_separate_all_coincided_role_connection_lines(erd);

    _erd_update_all_role_connection_line_endpoints(erd);

}

function _erd_update_all_role_anchors(erd)
{
    for (const relationship_set of erd['relationship_sets'])
    {
        for (const role of relationship_set['roles'])
        {
            const entity_set = erd_get_entity_set_by_id(erd, role['entity_set_id']);
            const anchors = _compute_role_anchors(relationship_set, entity_set);

            _set_role_anchors(role, anchors);
        }
    }
}

function _erd_separate_all_coincided_role_connection_lines(erd)
{
    for (const relationship_set of erd['relationship_sets'])
    {
        for (const role of relationship_set['roles'])
        {
            const coincided_roles = [role]
            for (const r of relationship_set['roles'])
            {
                if (role['id'] != r['id'] && _is_role_coincided(role, r))
                {
                    coincided_roles.push(r);
                }
            }
            
            if (coincided_roles.length == 2)
            {
                const entity_set = erd_get_entity_set_by_id(erd, coincided_roles[0]['entity_set_id']);

                const new_anchors = _compute_separated_anchors_of_two_coincided_role_connections(
                    relationship_set, entity_set, coincided_roles[0], coincided_roles[1]
                );

                _set_role_anchors(coincided_roles[0], new_anchors[0]);
                _set_role_anchors(coincided_roles[1], new_anchors[1]);
            }
        }
    } 
}

function _erd_update_all_role_connection_line_endpoints(erd)
{
    for (const relationship_set of erd['relationship_sets'])
    {
        for (const role of relationship_set['roles'])
        {
            const entity_set = erd_get_entity_set_by_id(erd, role['entity_set_id']);

            const endpoints = _compute_role_endpoints_from_anchors(relationship_set, entity_set, role);

            _set_role_endpoints(role, endpoints);
        }
    }
}

function _set_role_endpoints(role, endpoints)
{
    role['relationship_set_endpoint'] = endpoints['relationship_set_endpoint'];
    role['entity_set_endpoint'] = endpoints['entity_set_endpoint'];
}


function _compute_separated_anchors_of_two_coincided_role_connections(relationship_set, entity_set, one_of_roles)
{
    let new_ra_0 = {...one_of_roles['relationship_set_anchor']}
    let new_ea_0 = {...one_of_roles['entity_set_anchor']}

    let new_ra_1 = {...one_of_roles['relationship_set_anchor']}
    let new_ea_1 = {...one_of_roles['entity_set_anchor']}


    const anchor_x_ratio = entity_set['width']/relationship_set['width']/2;
    const anchor_y_ratio = entity_set['height']/relationship_set['height']/2;

    if (one_of_roles['entity_set_anchor']['x'] == 1 && one_of_roles['entity_set_anchor']['y'] == 0)
    {
        // east
        new_ea_0 = {
            x: 1, y: -0.5,
        }
        new_ea_1 = {
            x: 1, y: 0.5,
        }
        
        new_ra_0 = {
            x: -(1-anchor_y_ratio), y: -anchor_y_ratio
        }
        new_ra_1 = {
            x: -(1-anchor_y_ratio), y: anchor_y_ratio
        }
    }
    else if (one_of_roles['entity_set_anchor']['x'] == 0 && one_of_roles['entity_set_anchor']['y'] == 1)
    {
        // south
        new_ea_0 = {
            x: -0.5, y: 1,
        }
        new_ea_1 = {
            x: 0.5, y: 1,
        }
        
        new_ra_0 = {
            x: -anchor_x_ratio, y: -(1-anchor_x_ratio)
        }
        new_ra_1 = {
            x: anchor_x_ratio, y: -(1-anchor_x_ratio)
        }
    }
    else if (one_of_roles['entity_set_anchor']['x'] == -1 && one_of_roles['entity_set_anchor']['y'] == 0)
    {
        // west
        new_ea_0 = {
            x: -1, y: -0.5,
        }
        new_ea_1 = {
            x: -1, y: 0.5,
        }
        
        new_ra_0 = {
            x: (1-anchor_y_ratio), y: -anchor_y_ratio
        }
        new_ra_1 = {
            x: (1-anchor_y_ratio), y: anchor_y_ratio
        }
    }
    else if (one_of_roles['entity_set_anchor']['x'] == 0 && one_of_roles['entity_set_anchor']['y'] == -1)
    {
        // north
        new_ea_0 = {
            x: -0.5, y: -1,
        }
        new_ea_1 = {
            x: 0.5, y: -1,
        }
        
        new_ra_0 = {
            x: -anchor_x_ratio, y: 1-anchor_x_ratio
        }
        new_ra_1 = {
            x: anchor_x_ratio, y: 1-anchor_x_ratio
        }
    }

    return [
        {
            relationship_set_anchor: new_ra_0,
            entity_set_anchor: new_ea_0
        },
        {
            relationship_set_anchor: new_ra_1,
            entity_set_anchor: new_ea_1
        }
    ]
}

function _is_role_coincided(a, b)
{
    return (a['entity_set_id'] == b['entity_set_id']
        && a['relationship_set_anchor']['x'] == b['relationship_set_anchor']['x']
        && a['relationship_set_anchor']['y'] == b['relationship_set_anchor']['y']
        && a['entity_set_anchor']['x'] == b['entity_set_anchor']['x']
        && a['entity_set_anchor']['y'] == b['entity_set_anchor']['y']);
}


function _set_role_anchors(role, anchors)
{
    role['relationship_set_anchor'] = anchors['relationship_set_anchor'];
    role['entity_set_anchor'] = anchors['entity_set_anchor'];
}


function _compute_role_endpoints_from_anchors(relationship_set, entity_set, anchors)
{
    const ra = anchors['relationship_set_anchor']
    const ea = anchors['entity_set_anchor']

    const r = relationship_set;
    const e = entity_set;

    const x1 = ra['x'] * r['width']/2 + r['x'];
    const y1 = ra['y'] * r['height']/2 + r['y'];
    const x2 = ea['x'] * e['width']/2 + e['x'];
    const y2 = ea['y'] * e['height']/2 + e['y'];

    return {
        relationship_set_endpoint: {
            x: x1,
            y: y1,
        },
        entity_set_endpoint: {
            x: x2,
            y: y2,
        },
    };
}

function _compute_role_anchors(relationship_set, entity_set)
{
    // entity set relative position to relationship set
    const x = entity_set['x'] - relationship_set['x'];
    const y = entity_set['y'] - relationship_set['y'];

    let ra = [0, 0];
    let ea = [0, 0];

    if (x == 0)
    {
        // on the y axis
        if (y > 0)
        {
            ra = [0, 1]
            ea = [0, -1]
        }
        else
        {
            ra = [0, -1]
            ea = [0, 1]
        }
    } 
    else
    {
        /* anchor cases of relationship set and entity set relative position */
        const ANCHOR_CASES = {
            'EAST': {
                ra: [1,  0],
                ea: [-1, 0]
            },
            'EAST_NORTH': {
                ra: [1,  0],
                ea: [-1, -1]
            },
            'NORTH_EAST': {
                ra: [0,  1],
                ea: [-1, -1]
            },
            'NORTH': {
                ra: [0,  1],
                ea: [0, -1]
            },
            'NORTH_WEST': {
                ra: [0,  1],
                ea: [1, -1]
            },
            'WEST_NORTH': {
                ra: [-1, 0],
                ea: [1, -1]
            },
            'WEST': {
                ra: [-1, -0],
                ea: [1, 0]
            },
            'WEST_SOUTH': {
                ra: [-1, 0],
                ea: [1, 1]
            },
            'SOUTH_WEST': {
                ra: [0, -1],
                ea: [1, 1]
            },
            'SOUTH': {
                ra: [0, -1],
                ea: [0, 1]
            },
            'SOUTH_EAST': {
                ra: [0, -1],
                ea: [-1, 1]
            },
            'EAST_SOUTH': {
                ra: [1, 0],
                ea: [-1, 1]
            }
        }

        let relative_position = null;
        const k = y/x;
        const K_KEY_VALUES = [
            Math.tan(-Math.PI*5/12),
            Math.tan(-Math.PI*1/4),
            Math.tan(-Math.PI*1/12),
            Math.tan(Math.PI*1/12),
            Math.tan(Math.PI*1/4),
            Math.tan(Math.PI*5/12),
        ]
        if (k <= K_KEY_VALUES[0])
        {
            relative_position = x > 0 ? 
                ANCHOR_CASES['SOUTH'] : ANCHOR_CASES['NORTH']
        }
        else if (k > K_KEY_VALUES[0] && k <= K_KEY_VALUES[1])
        {
            relative_position = x > 0 ?
                ANCHOR_CASES['SOUTH_EAST'] : ANCHOR_CASES['NORTH_WEST']
        }
        else if (k > K_KEY_VALUES[1] && k <= K_KEY_VALUES[2])
        {
            relative_position = x > 0 ?
                ANCHOR_CASES['EAST_SOUTH'] : ANCHOR_CASES['WEST_NORTH']
        }
        else if (k > K_KEY_VALUES[2] && k <= K_KEY_VALUES[3])
        {
            relative_position = x > 0 ?
                ANCHOR_CASES['EAST'] : ANCHOR_CASES['WEST']
        }
        else if (k > K_KEY_VALUES[3] && k <= K_KEY_VALUES[4])
        {
            relative_position = x > 0 ?
                ANCHOR_CASES['EAST_NORTH'] : ANCHOR_CASES['WEST_SOUTH']
        }
        else if (k > K_KEY_VALUES[4] && k <= K_KEY_VALUES[5])
        {
            relative_position = x > 0 ?
                ANCHOR_CASES['NORTH_EAST'] : ANCHOR_CASES['SOUTH_WEST']
        }
        else
        {
            relative_position = x > 0 ?
                ANCHOR_CASES['NORTH'] : ANCHOR_CASES['SOUTH']
        }

        ra = relative_position['ra']
        ea = relative_position['ea']
    }
    
    return {
        relationship_set_anchor: {
            x: ra[0],
            y: ra[1],
        },
        entity_set_anchor: {
            x: ea[0],
            y: ea[1],
        },
    };
}

function erd_relationship_set_add_role(erd, relationship_set, entity_set, role_name, role_multiplicity)
{
    const role = {
        id: erd_generate_id(),
        entity_set_id: entity_set['id'],
        role_name,
        role_multiplicity
    };

    relationship_set['roles'].push(role);

    erd_layout_role_connection_lines(erd);
}

function erd_elationship_set_remove_role(erd, relationship_set, role)
{
    let idx = relationship_set['roles'].indexOf(role);
    if (idx != -1)
    {
        relationship_set['roles'].splice(idx, 1);
    }

    erd_layout_role_connection_lines(erd);
}


function get_relationship_set_by_name(erd, name)
{
    for (const r of erd['relationship_sets'])
    {
        if (r['name'] == name)
        {
            return r;
        }
    }
    return null;
}

function erd_get_relationship_set_by_id(erd, id)
{
    for (const r of erd['relationship_sets'])
    {
        if (r['id'] == id)
        {
            return r;
        }
    }
    return null;
}

function erd_get_relationship_set_role_by_id(erd, relationship_set, role_id)
{
    for (const r of relationship_set['roles'])
    {
        if (r['id'] == role_id)
        {
            return r;
        }
    }
    return null;
}

function erd_get_entity_set_by_name(erd, name)
{
    for (const e of erd['entity_sets'])
        {
            if (e['name'] == name)
            {
                return e;
            }
        }
        return null;
}

function erd_get_entity_set_by_id(erd, id)
{
    for (const e of erd['entity_sets']) {
        if (e['id'] == id) {
            return e;
        }
    }
    return null;
}

function get_object_by_coordinate(erd, x, y)
{
    for (let i = 0; i < erd["entity_sets"].length; i++) {
        const e = erd["entity_sets"][i];
        const v = {
            x: x - e['x'],
            y: y - e['y'],
        }
        const rx = e['width']/2;
        const ry = e['height']/2;
        if (v['x'] > -rx && v['x'] < rx
            && v['y'] > -ry && v['y'] < ry)
        {
            return e;
        }
    }

    for (let i = 0; i < erd["relationship_sets"].length; i++) {
        const r = erd["relationship_sets"][i];
        // change pointer coordinate to be relative the relationship diamond center.
        const v = {
            x: x - r['x'],
            y: y - r['y'],
        }
        /* Assume the diamond is ecnlosed by 4 straight lines, L1, L2, L3, L4.
         * Their equations are
         * Y1 = K1*x + b1, K1 = (height/2) / (width/2) , b1 = (height/2)
         * Y2 = K2*x + b2, K2 = (-height/2) / (width/2) , b2 = (height/2)
         * Y3 = K3*x + b3, K3 = (height/2) / (width/2) , b3 = -(height/2)
         * Y4 = K4*x + b4, K4 = (-height/2) / (width/2) , b4 = -(height/2)
         * respectively.
         * 
         * V is in the diamond if and on if Y4 < v.x < Y1 and Y3 < v.y < Y2
         */
        const vy = v['y'];
        const vx = v['x'];
        const height = r['height'];
        const width = r['width'];
        const y1 = vx * height/width + height/2;
        const y2 = - vx * height/width + height/2;
        const y3 = vx * height/width - height/2;
        const y4 = - vx * height/width - height/2;

        if (vy > y4 && vy < y1 && vy > y3 && vy < y2)
        {
            return r;
        }
    }

    return null;
}

function erd_change_settings(erd, settings) {
    erd['width'] = settings['width'];
    erd['height'] = settings['height'];
    erd['entity_set.width'] = settings['entity_set.width'];
    erd['entity_set.height'] = settings['entity_set.height'];
    erd['relationship_set.width'] = settings['relationship_set.width'];
    erd['relationship_set.height'] = settings['relationship_set.height'];
    
    for (const e of erd['entity_sets'])
    {
        e['width'] = erd['entity_set.width'];
        e['height'] = erd['entity_set.height'];
    }

    for (const r of erd['relationship_sets'])
    {
        r['width'] = erd['relationship_set.width'];
        r['height'] = erd['relationship_set.height'];
    }

    erd_layout_role_connection_lines(erd);
}