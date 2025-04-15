/*
 * ERD model
 */

const erd_config = {
    'entity.width': 100,
    'entity.height': 40,
};

function erd_create()
{
    return {
        "width": 1000,
        "height": 1000,
        'entity.width' : erd_config['entity.width'],
        'entity.height': erd_config['entity.height'],
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
    return null;
}