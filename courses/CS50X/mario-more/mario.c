#include <cs50.h>
#include <stdio.h>

int main(void)
{
    int i;
    do
    {
        i = get_int("Height: ");
    }
    while (i < 1 || i > 8);

    int n;
    int m;
    int j;
    int x;

    for (n = 0; n < i; n++)
    {
        for (x = 0; (x + n) < (i - 1); x++)
        {
            printf(" ");
        }
        for (m = 0; m <= n; m++)
        {
            printf("#");
        }
        printf("  ");
        for (j = 0; j <= n; j++)
        {
            printf("#");
        }
        printf("\n");
    }
}