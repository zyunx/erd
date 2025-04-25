/*
 * ERD model
 */

const erd_config = {
    'entity_set.width': 100,
    'entity_set.height': 50,
};

function erd_create()
{
    return {
        "width": 1000,
        "height": 1000,
        'entity_set.width' : erd_config['entity_set.width'],
        'entity_set.height': erd_config['entity_set.height'],
        'relationship_set.width': 140,
        'relationship_set.height': 70,
        "entity_sets": [],
        "relationship_sets": [],
    };
}

function erd_create_entity_set(erd, x = 0, y = 0)
{
    // (x, y) is the center of the rectangle
    const e = {
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
    for (const role of relationship_set['roles'])
    {
        erd_update_role(erd, relationship_set, role);
    }
}

function erd_move_entity_set(erd, entity_set, x, y)
{
    entity_set['x'] = x;
    entity_set['y'] = y;
    for (const rel of erd['relationship_sets'])
    {
        for (const role of rel['roles'])
        {
            if (role['entity_set'] === entity_set)
            {
                erd_update_role(erd, rel, role);
            }
        }
    }
}

function erd_update_role(erd, relationship_set, role)
{
    // end point
    const endpoints = erd_compute_role_endpoints(erd, relationship_set, role['entity_set']);
    role['relationship_set_endpoint'] = endpoints['relationship_set_endpoint'];
    role['entity_set_endpoint'] = endpoints['entity_set_endpoint'];
}

function erd_compute_role_name_label_pos(erd, relationship_set, role)
{

}


function erd_compute_role_endpoints(erd, relationship_set, entity_set)
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
    else if (Math.abs(y/x) > 1) {
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
    } else {
        if (x > 0)
        {
            ra = [1, 0]
            ea = [-1, 0]
        }
        else
        {
            ra = [-1, 0]
            ea = [1, 0]
        }
    }

    const r = relationship_set;
    const x1 = ra[0] * r['width']/2 + r['x'];
    const y1 = ra[1] * r['height']/2 + r['y'];
    const x2 = ea[0] * entity_set['width']/2 + entity_set['x'];
    const y2 = ea[1] * entity_set['height']/2 + entity_set['y'];

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

function erd_relationship_set_add_role(erd, relationship_set, entity_set, role_name, role_multiplicity)
{
    const endpoints = erd_compute_role_endpoints(erd, relationship_set, entity_set);

    relationship_set['roles'].push({
        entity_set,
        role_name,
        role_multiplicity,
        relationship_set_endpoint: endpoints['relationship_set_endpoint'],
        entity_set_endpoint: endpoints['entity_set_endpoint'],
    });
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

function get_entity_set_by_name(erd, name)
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