import Component from "@glimmer/component";
import { action } from "@ember/object";
import { ajax } from "discourse/lib/ajax";
import { withPluginApi } from "discourse/lib/plugin-api";

export default class GlobalFilterComposerItem extends Component {
  constructor(owner, args) {
    super(owner, args);
    if (!this.args) {
      this.args = args;
    }
    if (!this.args.selectedTags) {
      try {
        this.args.selectedTags = [];
      } catch { }
    }
  }

  get tagName() {
    try {
      return (
        this.args.filter.alternate_name ||
        this.args.filter.name?.replace(/-|_/g, " ") ||
        ""
      );
    } catch {
      return ""
    }
  }

  get checked() {
    try {
      return this.args.selectedTags?.includes(
        this.args.filter.name || this.args.tagParam
      ) || false;
    } catch {
      return false;
    }
  }

  set checked(value) {
    return value;
  }

  @action
  toggleTag() {
    try {
      if (this.args.selectedTags.includes(this.args.filter.name)) {
        const filterIndex = this.args.selectedTags.indexOf(this.args.filter.name);
        this.args.selectedTags.splice(filterIndex, 1);
      } else {
        this.args.selectedTags.push(this.args.filter.name);
      }
    } catch {
      this.args.selectedTags.push(this.args.filter.name);
    }

    withPluginApi("1.3.0", (api) => {
      ajax(`/global_filter/filter_tags/categories_for_filter_tags.json`, {
        data: { tags: this.args.selectedTags },
      }).then((model) => {
        api
          .modifySelectKit("category-chooser")
          .replaceContent((categoryDrop) => {
            if (!categoryDrop.selectKit.filter) {
              const categoriesAndSubcategories = model.categories.concat(
                model.subcategories
              );
              const filteredSubcategories = categoryDrop.content.filter((c) => {
                const categoriesByName = categoriesAndSubcategories.map(
                  (item) => item["name"]
                );

                return categoriesByName.includes(
                  c.name ||
                    categoryDrop.allCategoriesLabel ||
                    categoryDrop.noCategoriesLabel
                );
              });
              return filteredSubcategories;
            }
          });
      });
    });
  }
}
