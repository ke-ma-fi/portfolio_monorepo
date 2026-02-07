# TODO
while True:
    try:
        height = int(input("Height: "))
        if height > 0 and height < 9:
            break
    except ValueError:
        print("not an integer")

bricks = 1
space = height - 1

for rows in range(height):
    print(space * " " + bricks * "#" + "  " + bricks * "#")
    bricks += 1
    space -= 1
