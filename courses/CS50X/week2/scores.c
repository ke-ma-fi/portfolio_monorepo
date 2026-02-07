#include <cs50.h>
#include <stdio.h>

const int n = 3;

float average(int l, int array[]);

int main (void)
{
    int scores[n];
    for (int i = 0; i < n; i++)
    {
        scores[i] = get_int("Score: ");
    }

    printf("Average: %f\n", average(n, scores));
}

float average(int l, int array[])
{
    int sum = 0;
    for (int i = 0; i < l; i++)
    {
        sum += array[i];
    }
    return sum / (float) n;
}