#include <cs50.h>
#include <math.h>
#include <stdio.h>
#include <string.h>

const int BITS_IN_BYTE = 8;

void print_bulb(int bit);

int main(void)
{
    // TODO
    string text = get_string("What do you wanna encrypt? ");
    int n = strlen(text);
    int bit;
    for (int j = 0; j < n; j++)
    {
        int nbr = text[j];
        for (int i = 7; i >= 0; i--)
        {
            bit = nbr / pow(2, i);
            print_bulb(bit);
            nbr -= bit * pow(2, i);
        }
        printf("\n");
    }
}

void print_bulb(int bit)
{
    if (bit == 0)
    {
        // Dark emoji
        printf("\U000026AB");
    }
    else if (bit == 1)
    {
        // Light emoji
        printf("\U0001F7E1");
    }
}