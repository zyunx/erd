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
    };

    erd["relationship_sets"].push(r);

    return r;
}

function get_object_by_coordinate(erd, x, y)
{
    for (let i = 0; i < erd["entity_sets"].length; i++) {
        const e = erd["entity_sets"][i];
        const v = {
            x: x - e['x'],
            y: y - e['y'],
        }
        if (v['x'] > 0 && v['x'] < e['width']
            && v['y'] > 0 && v['y'] < e['height'])
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