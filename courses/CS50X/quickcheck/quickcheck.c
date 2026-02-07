#include <cs50.h>
#include <ctype.h>
#include <math.h>
#include <stdio.h>
#include <string.h>

bool checkdouble(int start, int end, char array[]);

int main (int argc, string argv[])
{
int start = 0;
int end = 26;

if (checkdouble(start, end, argv[1]))
{
    printf("ok\n");
}
else
{
    printf("double\n");
}

}

bool checkdouble(int start, int end, char array[])
{
    int alternate = 0;
    for (int i = start; i < end; i++)
    {
        for (int j = i + 1; j < end; j++)
        {
            if (array[i] == array[j])
            {
                alternate++;
            }
        }
    }
    if (alternate == 0)
    {
        return true;
    }
    else
    {
        return false;
    }
}