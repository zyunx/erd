/*
 * ERD model
 */

const erd_config = {
    'entity.width': 100,
    'entity.height': 50,
};

function erd_create()
{
    return {
        "width": 1000,
        "height": 1000,
        'entity.width' : erd_config['entity.width'],
        'entity.height': erd_config['entity.height'],
        'relationship.width': 140,
        'relationship.height': 70,
        "entities": [],
        "relationships": [],
    };
}

function erd_create_entity(erd, x = 0, y = 0)
{
    return {
        "x": x,
        "y": y,
        "width": erd['entity.width'],
        "height": erd['entity.height'],
        "name": "Entity",
        "type": "entity",
    }
}

function erd_add_entity(erd, entity) {
    erd["entities"].push(entity);
}

function erd_create_relationship(erd, x, y)
{
    // (x, y) is the center of the diamond
    const r = {
        x,
        y,
        "width": erd['relationship.width'],
        "height": erd['relationship.height'],
        "name": "Relationship",
        "type": "relationship",
    };

    erd["relationships"].push(r);

    return r;
}

function get_object_by_coordinate(erd, x, y)
{
    for (let i = 0; i < erd["entities"].length; i++) {
        const e = erd["entities"][i];
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

    for (let i = 0; i < erd["relationships"].length; i++) {
        const r = erd["relationships"][i];
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