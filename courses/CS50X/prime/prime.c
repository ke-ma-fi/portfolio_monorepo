#include <cs50.h>
#include <stdio.h>

bool prime(int number);

int main(void)
{
    int min;
    do
    {
        min = get_int("Minimum: ");
    }
    while (min < 1);

    int max;
    do
    {
        max = get_int("Maximum: ");
    }
    while (min >= max);

    for (int i = min; i <= max; i++)
    {
        if (prime(i))
        {
            printf("%i\n", i);
        }
    }
}

bool prime(int number)
{
    // TODO
    int boolnbr = 1;
    for (int j = 2; j < number; j++)
    {
        int remainder = 0;
        remainder = number % j;
        if (remainder == 0)
        {
            boolnbr--;
        }
    }
    if (boolnbr != 1 || number == 1)
    {
        return false;
    }
    else
    {
        return true;
    }
}
