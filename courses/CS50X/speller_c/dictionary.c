// Implements a dictionary's functionality

#include <ctype.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <strings.h>

#include "dictionary.h"

// Represents a node in a hash table
typedef struct node
{
    char word[LENGTH + 1];
    struct node *next;
} node;

// Global Counter for Dict_words
int dict_count = 0;

// TODO: Choose number of buckets in hash table
const unsigned int N = 1126;

// Hash table
node *table[N];

// Hashes word to a number (Caseinsenitive!)
unsigned int hash(const char *word)
{
    // TODO: Improve this hash function
    unsigned int val = 0;

    for (int i = 0; i < LENGTH + 1; i++)
    {
        if (word[i] == '\0')
        {
            break;
        }
        if (word[i] > 65)
        {
            val = val + (toupper(word[i]) - 'A');
        }
    }

    return val;
}

// Loads dictionary into memory, returning true if successful, else false
bool load(const char *dictionary)
{
    // TODO
    // set table->next to NULL
    for (int i = 0; i < N; i++)
    {
        table[i] = NULL;
    }

    // open dictionary
    FILE *file = fopen(dictionary, "r");
    if (file == NULL)
    {
        return false;
    }

    // read from dictionary to array while fread != EOF
    char buffer[LENGTH + 1];

    while (fscanf(file, "%s", buffer) != EOF)
    {
        node *n = malloc(sizeof(node));
        if (n == NULL)
        {
            return false;
        }

        strcpy(n->word, buffer);
        unsigned int h = hash(n->word);
        n->next = table[h];
        table[h] = n;
        dict_count++;

        for (int i = 0; i < LENGTH + 1; i++)
        {
            buffer[i] = '\0';
        }
    }

    // close dictionarry
    fclose(file);
    return true;
}

// Returns number of words in dictionary if loaded, else 0 if not yet loaded
unsigned int size(void)
{
    // TODO
    return dict_count;
}

// Returns true if word is in dictionary, else false
bool check(const char *word)
{
    // TODO
    unsigned int h = hash(word);
    node *trav;
    trav = table[h];
    while (trav != NULL)
    {
        if (strcasecmp(trav->word, word) == 0)
        {
            return true;
        }
        else
        {
            trav = trav->next;
        }
    }
    return false;
}

// Unloads dictionary from memory, returning true if successful, else false
bool unload(void)
{
    // TODO
    for (int i = 0; i < N; i++)
    {
        node *tmp = table[i];
        node *curs = table[i];
        while (curs != NULL)
        {
            curs = curs->next;
            free(tmp);
            tmp = curs;
        }
    }
    return true;
}
