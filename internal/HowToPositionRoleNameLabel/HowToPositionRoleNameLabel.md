# How To Position Role Name Label

![Role Name Label](fig1.png "ERD")

## Requirements
1. Role name label should be positioned about the center of role connection line.
2. Role name label should not intersect with the role connection line.

## Solution
![Solution](fig2.png "Solution")

First, I postion label so that the center of it(point C) is at the center of the role connection line.

Then I translate the label along the line which is perpendicular to the role connection line
until the label does not intersect the role connection.

Finally, I draw the label whose right-bottom is at A.

### How To Get The Translation Vector?

In the figure, the translation vector is AB.

Vector AB = Vector AC + Vector CB

Assume  
Vector CB = (x1, y1), y1=k*x1, k is the slope of role connection line;  
Vector AC = (-w/2, -h/2), w is the width of label bounding box, h is the height of the label bounding box;  
Vector AB = (x2, y2);

Then  
x1 + (-w/2) = x2  
y1 + (-h/2) = y2  
y1 = k * x1    
x1 * x2 + y1 * y2 = 0

The k and w is known, there 4 unkowns and 4 equations, so I can solve the equation group to get Vector AB(x2, y2).
