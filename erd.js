function erd_create_erd()
{
    return {
        "width": 1000,
        "height": 1000,
        "entities": [],
        "relationships": [],
    };
}

function erd_create_entity(x = 0, y = 0)
{
    return {
        "x": x,
        "y": y,
        "width": 100,
        "height": 40,
        "name": "Entity",
        "type": "entity",
    }
}

function erd_add_entity(erd, entity) {
    erd["entities"].push(entity);
}
