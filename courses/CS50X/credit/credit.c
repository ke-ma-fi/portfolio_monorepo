#include <cs50.h>
#include <math.h>
#include <stdio.h>

int main(void)
{
    // Promt for Input
    long x = get_long("Card Number: ");
    long s = x;

    // calculate cecksum "p" and check for length "n"
    int a;
    int y;
    int z;
    int p;
    int n;
    y = 0;
    z = 0;
    for (n = 0; x > 0; n++)
    {
        if (n % 2 == 0)
        {
            a = 0;
            a = (x % 10);
            y = y + (a % 10);
            x = (x - a) / 10;
        }
        if (n % 2 == 1)
        {
            a = 0;
            a = (x % 10);
            z = z + ((2 * a) % 10) + ((2 * a) / 10);
            x = (x - a) / 10;
        }
    }
    p = 0;
    p = z + y;

    // check for starting digits "s"
    long t;
    t = pow(10, (n - 2));
    s = s / t;

    // Print results
    if (p % 10 == 0)
    {
        if (n == 15 && (s == 34 || s == 37))
        {
            printf("AMEX\n");
        }
        else if (n == 16 && (s > 50 && s < 56))
        {
            printf("MASTERCARD\n");
        }
        else if ((n == 13 || n == 16) && s / 10 == 4)
        {
            printf("VISA\n");
        }
        else
        {
            printf("INVALID\n");
        }
    }
    else
    {
        printf("INVALID\n");
    }
}