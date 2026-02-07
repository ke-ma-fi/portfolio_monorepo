#include <cs50.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

typedef uint8_t BYTE;

int main(int argc, char *argv[])
{
    if (argc != 2)
    {
        printf("Usage: ./recover IMAGE\n");
    }
    FILE *infile = fopen(argv[1], "r");

    if (infile == NULL)
    {
        printf("Could not open %s\n", argv[1]);
        return 1;
    }

    BYTE buffer[512];
    int count = 0;
    char *filename = malloc(8);
    sprintf(filename, "000.jpg");
    FILE *img = fopen(filename, "w");

    while (fread(buffer, 1, 512, infile) == 512)
    {
        if (buffer[0] == 0xff && buffer[1] == 0xd8 && buffer[2] == 0xff && (buffer[3] & 0xf0) == 0xe0)
        {
            if (count == 0)
            {
                fwrite(buffer, 1, 512, img);
            }
            else
            {
                fclose(img);
                sprintf(filename, "%03i.jpg", count);
                img = fopen(filename, "w");
                fwrite(buffer, 1, 512, img);
            }
            count++;
        }
        else if (count > 0)
        {
            fwrite(buffer, 1, 512, img);
        }
    }
    fclose(img);
    fclose(infile);
    free(filename);
}
