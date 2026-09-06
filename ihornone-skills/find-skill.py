#!/usr/bin/env python3
"""
Skill Discovery Tool for AI Agents.

Usage:
    python3 find-skill.py <search_term>
    python3 find-skill.py --project-type web
    python3 find-skill.py --project-type mobile
    python3 find-skill.py --project-type telegram
    python3 find-skill.py --list-all
    python3 find-skill.py --tags async timeout
"""

import json
import sys
import os

REGISTRY_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "skills-registry.json")

def load_registry():
    with open(REGISTRY_PATH, "r") as f:
        return json.load(f)

def search_by_keyword(registry, keyword):
    """Search skills by keyword in tags, triggers, or id."""
    keyword = keyword.lower()
    results = []
    for skill in registry["skills"]:
        score = 0
        # Match in id
        if keyword in skill["id"].lower():
            score += 10
        # Match in tags
        for tag in skill.get("tags", []):
            if keyword in tag.lower():
                score += 5
        # Match in triggers
        for trigger in skill.get("triggers", []):
            if keyword in trigger.lower():
                score += 3
        # Match in layer
        if keyword in skill.get("layer", "").lower():
            score += 2
        if score > 0:
            results.append((score, skill))
    results.sort(key=lambda x: -x[0])
    return [s for _, s in results]

def search_by_project_type(registry, project_type):
    """Get skills recommended for a project type."""
    rules = registry.get("discovery_rules", {}).get("by_project_type", {})
    # Try exact match, then with suffixes
    skill_ids = rules.get(project_type, [])
    if not skill_ids:
        skill_ids = rules.get(f"{project_type}_app", [])
    if not skill_ids:
        skill_ids = rules.get(f"{project_type}_bot", [])
    return [s for s in registry["skills"] if s["id"] in skill_ids]

def search_by_task(registry, task):
    """Get skills recommended for a task."""
    rules = registry.get("discovery_rules", {}).get("by_task", {})
    skill_ids = rules.get(task, [])
    return [s for s in registry["skills"] if s["id"] in skill_ids]

def search_by_tags(registry, tags):
    """Search skills that match ALL given tags."""
    results = []
    for skill in registry["skills"]:
        skill_tags = set(t.lower() for t in skill.get("tags", []))
        search_tags = set(t.lower() for t in tags)
        if search_tags.issubset(skill_tags):
            results.append(skill)
    return results

def format_skill(skill, verbose=False):
    """Format a skill for display."""
    layer_icon = {
        "universal": "🌐",
        "web": "💻",
        "mobile": "📱",
        "telegram": "🤖"
    }.get(skill.get("layer", ""), "❓")

    line = f"  {layer_icon} {skill['id']}"
    if verbose:
        line += f" [{skill.get('layer', '?')}] v{skill.get('version', '?')}"
        line += f"\n     Path: {skill.get('path', '?')}"
        line += f"\n     Tags: {', '.join(skill.get('tags', [])[:8])}..."
        line += f"\n     Triggers: {', '.join(skill.get('triggers', [])[:5])}..."
    return line

def main():
    registry = load_registry()

    if len(sys.argv) < 2:
        print("Usage:")
        print("  python3 find-skill.py <search_term>       # Search by keyword")
        print("  python3 find-skill.py --project-type <type>  # Skills for project type")
        print("  python3 find-skill.py --task <task>        # Skills for task")
        print("  python3 find-skill.py --tags <tag1> <tag2> # Skills with ALL tags")
        print("  python3 find-skill.py --list-all           # List all skills")
        print("")
        print("Project types: web, mobile, telegram, cli, library, backend_api, background_job")
        print("Tasks: new_project, security_review, performance_review, test_writing,")
        print("       error_handling_review, logging_setup, api_documentation, readme_writing")
        sys.exit(1)

    args = sys.argv[1:]

    if args[0] == "--list-all":
        print("All Skills:")
        print("=" * 60)
        for layer_name, layer_info in registry["layers"].items():
            skills = [s for s in registry["skills"] if s["layer"] == layer_name]
            if skills:
                print(f"\n{layer_info['description']}")
                for s in skills:
                    print(format_skill(s))
        sys.exit(0)

    if args[0] == "--project-type" and len(args) > 1:
        project_type = args[1]
        results = search_by_project_type(registry, project_type)
        if results:
            print(f"Skills for '{project_type}' project:")
            print("=" * 60)
            for s in results:
                print(format_skill(s))
        else:
            print(f"No skills found for project type: {project_type}")
        sys.exit(0)

    if args[0] == "--task" and len(args) > 1:
        task = args[1]
        results = search_by_task(registry, task)
        if results:
            print(f"Skills for task '{task}':")
            print("=" * 60)
            for s in results:
                print(format_skill(s))
        else:
            print(f"No skills found for task: {task}")
        sys.exit(0)

    if args[0] == "--tags":
        tags = args[1:]
        results = search_by_tags(registry, tags)
        if results:
            print(f"Skills with tags [{', '.join(tags)}]:")
            print("=" * 60)
            for s in results:
                print(format_skill(s))
        else:
            print(f"No skills found with all tags: {tags}")
        sys.exit(0)

    # Default: keyword search
    keyword = args[0]
    results = search_by_keyword(registry, keyword)
    if results:
        print(f"Skills matching '{keyword}':")
        print("=" * 60)
        for s in results[:10]:
            print(format_skill(s, verbose=True))
            print()
    else:
        print(f"No skills found matching: {keyword}")
        print("Try --list-all to see all available skills.")

if __name__ == "__main__":
    main()
